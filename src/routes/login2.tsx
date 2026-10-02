import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/login2")({
  beforeLoad: () => {
    throw redirect({
      to: "/login",
    });
  },
});
