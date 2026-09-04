import { createFileRoute } from "@tanstack/react-router";

interface Payload {
  course?: string;
  category?: string;
  marks?: number;
  estimatedRank?: number | null;
  topColleges?: string[];
}

export const Route = createFileRoute("/api/ai-summary")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI unavailable", { status: 503 });

        const body = (await request.json()) as Payload;
        const course = String(body.course ?? "").slice(0, 80);
        const category = String(body.category ?? "").slice(0, 80);
        const marks = Number(body.marks ?? 0);
        const rank = body.estimatedRank ?? null;
        const colleges = (body.topColleges ?? []).slice(0, 6).map((c) => String(c).slice(0, 120));

        const prompt = [
          `A Nepali student selected ${course} under the ${category} category with ${marks} CEE marks out of 200.`,
          rank === null
            ? "No verified marks-to-rank curve exists for this program, so no rank estimate is available."
            : `Their estimated overall rank is ${rank}.`,
          colleges.length
            ? `Colleges where they currently have a HIGH chance: ${colleges.join(", ")}.`
            : "No college currently shows a HIGH chance for them.",
          "Write exactly three short sentences of plain-language advice for the student. Be honest, warm and specific. Do not use markdown, bullet points or headings.",
        ].join(" ");

        let upstream: Response;
        try {
          upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3.5-flash",
              stream: true,
              messages: [
                {
                  role: "system",
                  content:
                    "You are a calm, factual Nepali college admissions counsellor. Never invent college names or numbers beyond what you are given.",
                },
                { role: "user", content: prompt },
              ],
            }),
          });
        } catch {
          return new Response("AI unavailable", { status: 503 });
        }

        if (!upstream.ok || !upstream.body) {
          return new Response("AI unavailable", { status: upstream.status === 429 ? 429 : 503 });
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";

        const stream = new ReadableStream<Uint8Array>({
          async pull(controller) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              return;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const data = trimmed.slice(5).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data) as {
                  choices?: { delta?: { content?: string } }[];
                };
                const chunk = parsed.choices?.[0]?.delta?.content;
                if (chunk) controller.enqueue(encoder.encode(chunk));
              } catch {
                /* partial frame, ignore */
              }
            }
          },
          cancel() {
            void reader.cancel();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
