import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  BarChart3,
  Users,
  TrendingUp,
  Target,
  Search,
  Download,
  Phone,
  Building2,
  CheckCircle2,
  Sliders,
  Filter,
  Lock,
  Unlock,
  KeyRound,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Stethoscope,
  Briefcase,
  AlertTriangle,
  Plus,
  Edit2,
  Radio,
  RefreshCw,
  Activity,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getCurrentUser, type MetroUser } from "@/lib/auth";
import {
  isPhoneGrantedAdmin,
  getAdminPhones,
  isDeveloperUnlocked,
  isAdminUnlocked,
  verifyAdminAccess,
  lockAdminSession,
  phonesMatch,
} from "@/lib/admin-access";
import { getAdminPhonesServer } from "@/lib/admin.functions";
import { COURSES, CATEGORIES } from "@/lib/cee-constants";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard â€” METRO RANK Nepal CEE" },
      {
        name: "description",
        content: "Analyze users, rank predictions, college quotas and counseling enquiries.",
      },
    ],
  }),
  component: AdminDashboard,
});

interface StudentPrediction {
  id: string;
  name: string;
  phone: string;
  stream: "MBBS" | "BDS" | "BSc Nursing" | "BAMS" | "B. Pharm" | "BPH";
  exam: string;
  score: number | null;
  maxScore: number;
  category: string;
  admissionType: "Scholarship" | "Paying";
  predictedRank: number | null;
  date: string;
  rawDate: string;
}

interface CollegeItem {
  id: string;
  name: string;
  university: string;
  district: string;
  type: "Government" | "Private";
  mbbsSeats: number;
  scholarshipQuotaPercent: number;
  feeCapLakhs: number;
  status: "Open" | "Waitlist" | "Closed";
}

interface CounselingLead {
  id: string;
  name: string;
  phone: string;
  stream: string;
  targetColleges: string[];
  score: number;
  category: string;
  status: "New" | "Contacted" | "Closed";
  date: string;
}

function AdminDashboard() {
  const navigate = useNavigate();

  // Admin access validation
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => isAdminUnlocked());
  const [adminPhoneInput, setAdminPhoneInput] = useState("");
  const [accessError, setAccessError] = useState<string | null>(null);

  // Tabs: predictions (Screenshot 1), colleges, leads, rules
  const [activeTab, setActiveTab] = useState<"predictions" | "colleges" | "leads" | "rules">("predictions");

  // Filter state for predictions table
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highScore" | "topRank">("newest");

  // Colleges state
  const [colleges, setColleges] = useState<CollegeItem[]>([]);
  const [predictions, setPredictions] = useState<StudentPrediction[]>([]);
  const [leads, setLeads] = useState<CounselingLead[]>([]);
  const [userCount, setUserCount] = useState(0);

  // Fetch real data from Supabase
  useEffect(() => {
    // Import dynamically or ensure supabase is available
    const fetchOriginalData = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        
        // Fetch colleges from college_seats
        const { data: collegeData, error: collegeError } = await supabase
          .from("college_seats")
          .select("*");
          
        if (!collegeError && collegeData) {
          const mappedColleges: CollegeItem[] = collegeData.map(c => ({
            id: c.id,
            name: c.college,
            university: "", // Not available in college_seats currently
            district: c.district || "",
            type: (c.type === "Private" ? "Private" : "Government") as "Government"|"Private",
            mbbsSeats: c.seats_total,
            scholarshipQuotaPercent: 0,
            feeCapLakhs: 0,
            status: "Open"
          }));
          setColleges(mappedColleges);
        }

        // For student_predictions and counseling_leads, they might not exist in the schema yet
        try {
          const { data: predData } = await supabase.from("student_predictions" as any).select("*");
          if (predData) setPredictions(predData as any[]);
        } catch (e) {}

        try {
          const { data: leadsData } = await supabase.from("counseling_leads" as any).select("*");
          if (leadsData) setLeads(leadsData as any[]);
        } catch (e) {}

        try {
          const { count } = await supabase.from("profiles" as any).select("*", { count: "exact", head: true });
          if (count !== null) setUserCount(count);
        } catch (e) {}

      } catch (err) {
        console.error("Error fetching original data:", err);
      }
    };
    
    fetchOriginalData();
  }, []);

  const [editingCollege, setEditingCollege] = useState<CollegeItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCollegeName, setNewCollegeName] = useState("");
  const [newCollegeUniv, setNewCollegeUniv] = useState("Tribhuvan University (TU)");
  const [newCollegeDistrict, setNewCollegeDistrict] = useState("Kathmandu");
  const [newCollegeType, setNewCollegeType] = useState<"Government" | "Private">("Government");
  const [newCollegeSeats, setNewCollegeSeats] = useState(100);

  // Check on mount if current logged-in phone is granted admin
  useEffect(() => {
    void getCurrentUser().then(async (u) => {
      if (!u) {
        void navigate({ to: "/login" });
      } else {
        const adminPhones = await getAdminPhonesServer();
        const isGranted = u.phone ? adminPhones.some((p) => phonesMatch(p, u.phone!)) : false;
        
        if (isGranted) {
          verifyAdminAccess(u.phone!);
          setIsUnlocked(true);
        } else if (isDeveloperUnlocked()) {
          verifyAdminAccess(u.phone || "developer");
          setIsUnlocked(true);
        } else {
          void navigate({ to: "/" });
        }
      }
    });
  }, [navigate]);

  const handleAdminVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccessError(null);

    const adminPhones = await getAdminPhonesServer();
    const granted = adminPhones.some((p) => phonesMatch(p, adminPhoneInput));

    if (granted || isDeveloperUnlocked()) {
      verifyAdminAccess(adminPhoneInput);
      setIsUnlocked(true);
      setAccessError(null);
    } else {
      setAccessError("Access Denied: This phone number has not been granted admin access in the Developer Dashboard.");
    }
  };

  const handleAdminLock = () => {
    lockAdminSession();
    setIsUnlocked(false);
  };

  // Filtered Predictions
  const filteredPredictions = useMemo(() => {
    return predictions.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.stream.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      const matchesStart = !startDate || p.date >= startDate;
      const matchesEnd = !endDate || p.date <= endDate;

      return matchesSearch && matchesStart && matchesEnd;
    }).sort((a, b) => {
      if (sortBy === "newest") return b.date.localeCompare(a.date);
      if (sortBy === "oldest") return a.date.localeCompare(b.date);
      if (sortBy === "highScore") return (b.score ?? 0) - (a.score ?? 0);
      if (sortBy === "topRank") {
        if (a.predictedRank === null) return 1;
        if (b.predictedRank === null) return -1;
        return a.predictedRank - b.predictedRank;
      }
      return 0;
    });
  }, [searchQuery, startDate, endDate, sortBy]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "Student Name",
      "Phone Number",
      "Stream",
      "Exam",
      "Score",
      "Category",
      "Admission Type",
      "Predicted Rank",
      "Date",
    ];
    const rows = filteredPredictions.map((p) => [
      `"${p.name}"`,
      `"${p.phone}"`,
      `"${p.stream}"`,
      `"${p.exam}"`,
      p.score !== null ? `${p.score}/200` : "Not Provided",
      `"${p.category}"`,
      `"${p.admissionType}"`,
      p.predictedRank !== null ? p.predictedRank : "N/A",
      `"${p.rawDate}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MECEE_Predictions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleCollegeStatus = (id: string) => {
    setColleges((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === "Open" ? "Waitlist" : c.status === "Waitlist" ? "Closed" : "Open";
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  // Locked Gate: Admin access can ONLY be granted in developer page
  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-[#f8fafc] dark:bg-background flex flex-col justify-center items-center px-4 relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-md">
                <BarChart3 className="size-5" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-foreground">
                METRO<span className="text-primary"> RANK</span>
              </span>
            </Link>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2">
              <Lock className="size-3" />
              Admin Portal
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Admin Access Verification</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Admin access is strictly granted by platform engineers via the Developer Dashboard.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl">
            <form onSubmit={handleAdminVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Authorized Admin Phone Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={adminPhoneInput}
                    onChange={(e) => setAdminPhoneInput(e.target.value)}
                    placeholder="Enter authorized admin phone (e.g. +977...)"
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 pl-10 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    autoFocus
                  />
                  <Phone className="absolute left-3 top-3 size-4 text-muted-foreground" />
                </div>
              </div>

              {accessError && (
                <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger font-medium flex items-start gap-2">
                  <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                  <span>{accessError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 py-3 text-xs font-bold text-white shadow-md transition-colors"
              >
                <Unlock className="size-4" />
                Verify Admin Access
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-border/60 text-center space-y-2">
              <p className="text-[11px] text-muted-foreground">
                Need access? An authorized engineer must add your phone number under <strong>Access Management</strong> in the Developer Portal.
              </p>
              <Link to="/" className="text-xs text-muted-foreground hover:text-foreground inline-block pt-1">
                â† Return to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-background text-foreground pb-20">
      {/* Top Header */}
      <div className="border-b border-border/40 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-background hover:bg-secondary transition-colors"
                title="Back to Home"
              >
                <ChevronLeft className="size-5 text-foreground" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-primary font-bold">
                    <BarChart3 className="size-6" />
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-foreground">
                    Admin Dashboard
                  </h1>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Analyze users, rank predictions, college quotas and counseling enquiries
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={handleAdminLock}
                className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/20 transition-colors"
                title="End admin session"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Lock</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Top 3 KPI Cards matching Screenshot 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Registered Users */}
          <div
            onClick={() => setActiveTab("predictions")}
            className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs flex items-center gap-4 transition-all hover:shadow-md cursor-pointer"
          >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="size-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-foreground tracking-tight">{userCount}</div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">
                Registered Users
              </div>
            </div>
          </div>

          {/* Card 2: Rank Predictions Made */}
          <div
            onClick={() => setActiveTab("predictions")}
            className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs flex items-center gap-4 transition-all hover:shadow-md cursor-pointer"
          >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <TrendingUp className="size-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-foreground tracking-tight">{predictions.length}</div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">
                Rank Predictions Made
              </div>
            </div>
          </div>

          {/* Card 3: Counseling Leads */}
          <div
            onClick={() => setActiveTab("leads")}
            className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs flex items-center gap-4 transition-all hover:shadow-md cursor-pointer"
          >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Target className="size-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-foreground tracking-tight">{leads.length}</div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">
                Counseling Leads
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation for full features */}
        <div className="flex border-b border-border/60 overflow-x-auto no-scrollbar gap-2">
          <button
            onClick={() => setActiveTab("predictions")}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "predictions"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="size-4" />
            Student Predictions ({predictions.length})
          </button>
          <button
            onClick={() => setActiveTab("colleges")}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "colleges"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="size-4" />
            Colleges & Seat Matrix ({colleges.length})
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "leads"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Target className="size-4" />
            Counseling Enquiries ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "rules"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sliders className="size-4" />
            MEC Rules & Audit Logs
          </button>
        </div>

        {/* TAB 1: Student Rank Predictions matching Screenshot 1 */}
        {activeTab === "predictions" && (
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-5 animate-fade-in">
            {/* Header Row: Title + Badge + Export CSV Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="size-5 text-purple-600" />
                <h2 className="text-lg font-black text-foreground tracking-tight">
                  Student Rank Predictions
                </h2>
                <span className="rounded-md bg-secondary px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                  {filteredPredictions.length}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 px-4 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors shadow-xs"
                >
                  <Download className="size-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Search & Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-5 relative">
                <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone, stream..."
                  className="w-full rounded-xl border border-input bg-background/50 pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="sm:col-span-2 relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="sm:col-span-2 relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full rounded-xl border border-input bg-background/50 px-3 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highScore">Highest Score</option>
                  <option value="topRank">Top Rank First</option>
                </select>
              </div>
            </div>

            {/* Predictions Table */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border/60 bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="py-3.5 px-4">STUDENT</th>                      <th className="py-3.5 px-4">INTERESTED STREAMS</th>
                      <th className="py-3.5 px-4">EXAM</th>
                      <th className="py-3.5 px-4">CEE SCORE</th>
                      <th className="py-3.5 px-4">CATEGORY</th>
                      <th className="py-3.5 px-4">TYPE</th>
                      <th className="py-3.5 px-4">PREDICTED RANK</th>
                      <th className="py-3.5 px-4">DATE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 bg-card">
                    {filteredPredictions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                          No predictions found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredPredictions.map((p) => (
                        <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-foreground">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{p.phone}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-[10px] font-semibold text-foreground border border-border/60">
                              <Stethoscope className="size-3 text-muted-foreground" />
                              {p.stream}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-foreground">{p.exam}</td>
                          <td className="py-3 px-4">
                            {p.score !== null ? (
                              <div className="font-bold text-blue-600 dark:text-blue-400">
                                {p.score}<span className="text-[10px] text-muted-foreground font-medium">/{p.maxScore}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-[10px]">--/{p.maxScore}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium">{p.category}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              p.admissionType === "Scholarship" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                            }`}>
                              {p.admissionType}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {p.predictedRank !== null ? (
                              <span className="font-black text-foreground">#{p.predictedRank}</span>
                            ) : (
                              <span className="text-muted-foreground">--</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[10px] text-muted-foreground whitespace-nowrap">{p.rawDate}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs placeholders to complete the file */}
        {activeTab === "colleges" && (
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-5 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <Building2 className="size-5 text-blue-600" />
              <h2 className="text-lg font-black text-foreground tracking-tight">
                Colleges & Seat Matrix
              </h2>
              <span className="rounded-md bg-secondary px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                {colleges.length}
              </span>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border/60 bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-3.5 px-4">COLLEGE NAME</th>
                    <th className="py-3.5 px-4">DISTRICT</th>
                    <th className="py-3.5 px-4">TYPE</th>
                    <th className="py-3.5 px-4">MBBS SEATS</th>
                    <th className="py-3.5 px-4">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 bg-card">
                  {colleges.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No colleges found.
                      </td>
                    </tr>
                  ) : (
                    colleges.map((c) => (
                      <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-4 font-bold text-foreground">
                          {c.name}
                        </td>
                        <td className="py-3 px-4 font-medium">{c.district || "N/A"}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            c.type === "Government" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                          }`}>
                            {c.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold">{c.mbbsSeats}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "leads" && (
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-5 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <Target className="size-5 text-emerald-600" />
              <h2 className="text-lg font-black text-foreground tracking-tight">
                Counseling Enquiries
              </h2>
              <span className="rounded-md bg-secondary px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                {leads.length}
              </span>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border/60 bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-3.5 px-4">STUDENT</th>
                    <th className="py-3.5 px-4">SCORE</th>
                    <th className="py-3.5 px-4">STREAM</th>
                    <th className="py-3.5 px-4">CATEGORY</th>
                    <th className="py-3.5 px-4">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 bg-card">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No counseling inquiries found.
                      </td>
                    </tr>
                  ) : (
                    leads.map((l) => (
                      <tr key={l.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-foreground">{l.name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{l.phone}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">{l.score}</td>
                        <td className="py-3 px-4 font-semibold">{l.stream}</td>
                        <td className="py-3 px-4 font-medium">{l.category}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            l.status === "New" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                            l.status === "Contacted" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                            "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                          }`}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "rules" && (
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs animate-fade-in text-center py-12">
             <Sliders className="size-12 text-muted-foreground mx-auto mb-4 opacity-50" />
             <h2 className="text-lg font-bold text-foreground">MEC Rules & Audit Logs</h2>
             <p className="text-muted-foreground text-sm mt-2">Configure prediction algorithms and view system audit logs.</p>
          </div>
        )}

      </div>
    </main>
  );
}
