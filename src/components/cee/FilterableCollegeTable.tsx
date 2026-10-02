import { useState, useMemo } from "react";
import { Search, Building2, MapPin, X, SlidersHorizontal, School, Compass, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { CollegeRow } from "@/lib/predict.functions";
import { getCollegeUniversity, getProvince } from "@/lib/nepal-colleges-meta";

type SortField = "college" | "type" | "university" | "district" | "seats_total" | "cutoff";
type SortDir = "asc" | "desc";

function FilterChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all whitespace-nowrap",
        active
          ? "border-accent bg-accent text-white shadow-sm"
          : "border-border/60 bg-card text-muted-foreground hover:border-accent/40 hover:text-foreground",
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function CutoffBar({
  closingRank,
  studentRank,
}: {
  closingRank: number;
  studentRank: number | null;
}) {
  if (studentRank === null) return null;

  const maxRank = Math.max(closingRank, studentRank) * 1.25;
  const cutoffPct = Math.min(96, Math.max(4, (closingRank / maxRank) * 100));
  const studentPct = Math.min(96, Math.max(4, (studentRank / maxRank) * 100));

  const isGood = studentRank <= closingRank;
  const isClose = studentRank <= closingRank * 1.15;

  return (
    <div className="w-full space-y-1.5 py-1">
      {/* Progress Track */}
      <div className="relative h-3 w-full rounded-full bg-secondary/80 overflow-hidden border border-border/40">
        {/* Cutoff zone fill */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-primary/10 border-r-2 border-primary/60"
          style={{ width: `${cutoffPct}%` }}
        />
        {/* Student rank bar */}
        <div
          className={cn(
            "absolute top-0 bottom-0 left-0 rounded-full transition-all duration-500",
            isGood
              ? "bg-gradient-to-r from-success/80 to-success"
              : isClose
                ? "bg-gradient-to-r from-warning/80 to-warning"
                : "bg-gradient-to-r from-danger/80 to-danger",
          )}
          style={{ width: `${studentPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span
          className={cn(
            "font-bold flex items-center gap-1",
            isGood
              ? "text-success"
              : isClose
                ? "text-warning-strong"
                : "text-danger",
          )}
        >
          <span className="size-1.5 rounded-full inline-block bg-current" />
          Rank: {studentRank.toLocaleString()}
          <span className="text-[10px] font-normal opacity-80">
            {isGood ? "(Safe)" : isClose ? "(Borderline)" : "(Stretch)"}
          </span>
        </span>
        <span className="text-muted-foreground font-medium">
          Cutoff: <strong className="text-foreground">{closingRank.toLocaleString()}</strong>
        </span>
      </div>
    </div>
  );
}

export function FilterableCollegeTable({
  colleges,
  program,
  estimatedRank,
  closingRanks,
}: {
  colleges: CollegeRow[];
  program: string;
  estimatedRank: number | null;
  closingRanks: Map<string, number>;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [univFilter, setUnivFilter] = useState<string | null>(null);
  const [provinceFilter, setProvinceFilter] = useState<string | null>(null);
  const [districtFilter, setDistrictFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("college");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showFilters, setShowFilters] = useState(true);

  // Annotate colleges with university and province
  const enrichedColleges = useMemo(() => {
    return colleges.map((c) => {
      const u = getCollegeUniversity(c.college);
      const prov = getProvince(c.district);
      const cutoff = closingRanks.get(c.college) ?? null;
      return {
        ...c,
        universityCode: u.code,
        universityName: u.name,
        universityBadge: u.badgeClass,
        province: prov,
        closingRank: cutoff,
      };
    });
  }, [colleges, closingRanks]);

  // Extract unique universities
  const universities = useMemo(() => {
    const map = new Map<string, number>();
    enrichedColleges.forEach((c) => {
      map.set(c.universityCode, (map.get(c.universityCode) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [enrichedColleges]);

  // Extract unique provinces
  const provinces = useMemo(() => {
    const map = new Map<string, number>();
    enrichedColleges.forEach((c) => {
      map.set(c.province, (map.get(c.province) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [enrichedColleges]);

  // Popular districts
  const popularDistricts = useMemo(() => {
    const map = new Map<string, number>();
    enrichedColleges.forEach((c) => {
      if (c.district) {
        map.set(c.district, (map.get(c.district) ?? 0) + 1);
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [enrichedColleges]);

  // Filter and sort
  const filteredColleges = useMemo(() => {
    let result = [...enrichedColleges];

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.college.toLowerCase().includes(q) ||
          c.universityName.toLowerCase().includes(q) ||
          c.universityCode.toLowerCase().includes(q) ||
          (c.district && c.district.toLowerCase().includes(q)) ||
          c.province.toLowerCase().includes(q),
      );
    }

    // Type filter
    if (typeFilter) {
      result = result.filter((c) => c.type === typeFilter);
    }

    // University filter
    if (univFilter) {
      result = result.filter((c) => c.universityCode === univFilter);
    }

    // Province filter
    if (provinceFilter) {
      result = result.filter((c) => c.province === provinceFilter);
    }

    // District filter
    if (districtFilter) {
      result = result.filter((c) => c.district === districtFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "college":
          cmp = a.college.localeCompare(b.college);
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
        case "university":
          cmp = a.universityCode.localeCompare(b.universityCode);
          break;
        case "district":
          cmp = (a.district ?? "").localeCompare(b.district ?? "");
          break;
        case "seats_total":
          cmp = a.seats_total - b.seats_total;
          break;
        case "cutoff":
          cmp = (a.closingRank ?? 999999) - (b.closingRank ?? 999999);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [
    enrichedColleges,
    search,
    typeFilter,
    univFilter,
    provinceFilter,
    districtFilter,
    sortField,
    sortDir,
  ]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="size-3.5 opacity-40 ml-1 inline-block" />;
    }
    return (
      <span className="ml-1 text-[11px] font-bold text-white">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const hasActiveFilters = search || typeFilter || univFilter || provinceFilter || districtFilter;

  const clearAllFilters = () => {
    setSearch("");
    setTypeFilter(null);
    setUnivFilter(null);
    setProvinceFilter(null);
    setDistrictFilter(null);
  };

  if (colleges.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-surface/50 p-8 text-center">
        <div className="mx-auto size-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
          <Building2 className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          The 2025/26 college list for {program} has not been loaded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by college name, university (TU, KU, PAHS), district, or province..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl h-11 border-border/60 bg-card"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all shadow-sm",
              showFilters
                ? "border-accent bg-accent/10 text-accent"
                : "border-border/60 bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <SlidersHorizontal className="size-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="size-2 rounded-full bg-accent" />
            )}
          </button>
        </div>

        {/* Filter chips container */}
        {showFilters && (
          <div className="rounded-2xl border border-border/50 bg-card/60 p-3.5 sm:p-4 space-y-3.5 animate-fade-in">
            {/* Type filters */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="w-full sm:w-auto text-[11px] font-bold text-muted-foreground uppercase tracking-wider sm:min-w-[72px]">
                Type:
              </span>
              <FilterChip
                label="All Types"
                active={typeFilter === null}
                count={enrichedColleges.length}
                onClick={() => setTypeFilter(null)}
              />
              <FilterChip
                label="Public / Govt"
                active={typeFilter === "Public"}
                count={enrichedColleges.filter((c) => c.type === "Public").length}
                onClick={() => setTypeFilter(typeFilter === "Public" ? null : "Public")}
              />
              <FilterChip
                label="Private"
                active={typeFilter === "Private"}
                count={enrichedColleges.filter((c) => c.type === "Private").length}
                onClick={() => setTypeFilter(typeFilter === "Private" ? null : "Private")}
              />
            </div>

            {/* University filters */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="w-full sm:w-auto text-[11px] font-bold text-muted-foreground uppercase tracking-wider sm:min-w-[72px] flex items-center gap-1">
                <School className="size-3" /> Univ:
              </span>
              <FilterChip
                label="All Universities"
                active={univFilter === null}
                onClick={() => setUnivFilter(null)}
              />
              {universities.map(([code, count]) => (
                <FilterChip
                  key={code}
                  label={code}
                  active={univFilter === code}
                  count={count}
                  onClick={() => setUnivFilter(univFilter === code ? null : code)}
                />
              ))}
            </div>

            {/* Province filters */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="w-full sm:w-auto text-[11px] font-bold text-muted-foreground uppercase tracking-wider sm:min-w-[72px] flex items-center gap-1">
                <Compass className="size-3" /> Province:
              </span>
              <FilterChip
                label="All Nepal"
                active={provinceFilter === null}
                onClick={() => setProvinceFilter(null)}
              />
              {provinces.map(([prov, count]) => (
                <FilterChip
                  key={prov}
                  label={`${prov} (${count})`}
                  active={provinceFilter === prov}
                  onClick={() => setProvinceFilter(provinceFilter === prov ? null : prov)}
                />
              ))}
            </div>

            {/* Popular District filters */}
            {popularDistricts.length > 0 && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="w-full sm:w-auto text-[11px] font-bold text-muted-foreground uppercase tracking-wider sm:min-w-[72px] flex items-center gap-1">
                  <MapPin className="size-3" /> District:
                </span>
                <FilterChip
                  label="All Districts"
                  active={districtFilter === null}
                  onClick={() => setDistrictFilter(null)}
                />
                {popularDistricts.slice(0, 8).map(([d, count]) => (
                  <FilterChip
                    key={d}
                    label={d}
                    active={districtFilter === d}
                    count={count}
                    onClick={() => setDistrictFilter(districtFilter === d ? null : d)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active filters summary */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-[13px] px-1">
            <span className="text-muted-foreground">
              Showing <strong className="text-foreground">{filteredColleges.length}</strong> of{" "}
              {colleges.length} colleges
            </span>
            <button
              onClick={clearAllFilters}
              className="text-accent hover:underline font-semibold"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3.5 md:hidden">
        {filteredColleges.map((c) => (
          <li
            key={c.id}
            className={cn(
              "rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all hover:shadow-md space-y-3",
              !c.historical_cutoff_loaded && "opacity-65",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-foreground text-sm leading-snug">{c.college}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold",
                      c.universityBadge,
                    )}
                  >
                    {c.universityCode}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold",
                      c.type === "Public"
                        ? "bg-success/15 text-success"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {c.type}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-foreground block">
                  {c.seats_total}
                </span>
                <span className="text-[10px] text-muted-foreground block">seats</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
              {c.district && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" />
                  {c.district} ({c.province})
                </span>
              )}
            </div>

            {/* Visual Cutoff progress bar */}
            {c.closingRank !== null ? (
              <CutoffBar
                closingRank={c.closingRank}
                studentRank={estimatedRank}
              />
            ) : (
              <p className="text-[11px] text-muted-foreground italic">
                No historical cutoff recorded yet for this college
              </p>
            )}
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-sm md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="gradient-rank text-left text-white">
              <th
                className="px-5 py-3.5 font-bold rounded-tl-2xl cursor-pointer select-none hover:bg-white/10 transition-colors"
                onClick={() => toggleSort("college")}
              >
                College <SortIndicator field="college" />
              </th>
              <th
                className="px-4 py-3.5 font-bold cursor-pointer select-none hover:bg-white/10 transition-colors"
                onClick={() => toggleSort("university")}
              >
                University <SortIndicator field="university" />
              </th>
              <th
                className="px-4 py-3.5 font-bold cursor-pointer select-none hover:bg-white/10 transition-colors"
                onClick={() => toggleSort("type")}
              >
                Type <SortIndicator field="type" />
              </th>
              <th
                className="px-4 py-3.5 font-bold cursor-pointer select-none hover:bg-white/10 transition-colors"
                onClick={() => toggleSort("district")}
              >
                Location <SortIndicator field="district" />
              </th>
              <th
                className="px-4 py-3.5 text-right font-bold cursor-pointer select-none hover:bg-white/10 transition-colors"
                onClick={() => toggleSort("seats_total")}
              >
                Seats <SortIndicator field="seats_total" />
              </th>
              <th
                className="px-5 py-3.5 font-bold cursor-pointer select-none hover:bg-white/10 transition-colors min-w-[200px]"
                onClick={() => toggleSort("cutoff")}
              >
                Rank vs 2024 Cutoff <SortIndicator field="cutoff" />
              </th>
              <th className="px-4 py-3.5 font-bold text-center rounded-tr-2xl">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredColleges.map((c, i) => (
              <tr
                key={c.id}
                className={cn(
                  i % 2 === 1 ? "bg-surface/30" : "bg-card",
                  "transition-colors hover:bg-accent/5 border-b border-border/20 last:border-0",
                  !c.historical_cutoff_loaded && "text-muted-foreground opacity-60",
                )}
              >
                <td className="px-5 py-3.5 font-semibold text-foreground max-w-xs">
                  {c.college}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold",
                      c.universityBadge,
                    )}
                    title={c.universityName}
                  >
                    {c.universityCode}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                      c.type === "Public"
                        ? "bg-success/15 text-success"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {c.type}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs text-muted-foreground">
                  <div className="font-medium text-foreground">{c.district ?? "—"}</div>
                  <div className="text-[10px] text-muted-foreground">{c.province}</div>
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums font-bold text-foreground">
                  {c.seats_total}
                </td>
                <td className="px-5 py-3.5">
                  {c.closingRank !== null ? (
                    <CutoffBar
                      closingRank={c.closingRank}
                      studentRank={estimatedRank}
                    />
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic">
                      Cutoff pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {c.historical_cutoff_loaded ? (
                    <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                      ✓ Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
