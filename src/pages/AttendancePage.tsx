import { useState, useMemo } from "react";
import { useStudents } from "@/hooks/useSupabaseData";
import { useAllAttendance, useUpsertAttendance } from "@/hooks/useAttendance";
import { MONTH_NAMES } from "@/hooks/useMonthlyReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, Filter, UserCheck, Thermometer, HandHeart, UserX } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#22c55e", "#f59e0b", "#3b82f6", "#ef4444"];

const AttendancePage = () => {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: attendance = [], isLoading: loadingAtt } = useAllAttendance();
  const upsert = useUpsertAttendance();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [present, setPresent] = useState(0);
  const [sick, setSick] = useState(0);
  const [permission, setPermission] = useState(0);
  const [absent, setAbsent] = useState(0);

  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  const filtered = useMemo(() => {
    let r = attendance;
    if (filterKelas !== "all") r = r.filter(a => (a as any).students?.kelas === Number(filterKelas));
    if (filterMonth !== "all") r = r.filter(a => a.month === Number(filterMonth));
    return r;
  }, [attendance, filterKelas, filterMonth]);

  // Aggregate for pie chart
  const totals = useMemo(() => {
    const t = { present: 0, sick: 0, permission: 0, absent: 0 };
    filtered.forEach(a => {
      t.present += a.present;
      t.sick += a.sick;
      t.permission += a.permission;
      t.absent += a.absent;
    });
    return t;
  }, [filtered]);

  const pieData = [
    { name: "Hadir", value: totals.present },
    { name: "Sakit", value: totals.sick },
    { name: "Izin", value: totals.permission },
    { name: "Alfa", value: totals.absent },
  ].filter(d => d.value > 0);

  const handleSubmit = async () => {
    if (!selectedStudentId) {
      toast({ title: "Pilih siswa", variant: "destructive" });
      return;
    }
    try {
      await upsert.mutateAsync({
        student_id: selectedStudentId,
        month, year, present, sick, permission, absent,
      });
      toast({ title: "Absensi berhasil disimpan ✅" });
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
    }
  };

  if (loadingStudents || loadingAtt) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Absensi Bulanan</h1>
          <p className="text-sm text-muted-foreground">Catat kehadiran siswa setiap bulan</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Catat Absensi</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Catat Absensi Bulanan</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Pilih Siswa</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger><SelectValue placeholder="Pilih siswa..." /></SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.nama} — Kelas {s.kelas}{s.rombel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Bulan</Label>
                  <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tahun</Label>
                  <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="flex items-center gap-1"><UserCheck className="w-3 h-3 text-emerald-500" /> Hadir</Label>
                  <Input type="number" min={0} value={present} onChange={e => setPresent(Number(e.target.value))} />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-amber-500" /> Sakit</Label>
                  <Input type="number" min={0} value={sick} onChange={e => setSick(Number(e.target.value))} />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><HandHeart className="w-3 h-3 text-blue-500" /> Izin</Label>
                  <Input type="number" min={0} value={permission} onChange={e => setPermission(Number(e.target.value))} />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><UserX className="w-3 h-3 text-red-500" /> Alfa</Label>
                  <Input type="number" min={0} value={absent} onChange={e => setAbsent(Number(e.target.value))} />
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={upsert.isPending} className="w-full">
                {upsert.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Simpan Absensi
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterKelas} onValueChange={setFilterKelas}>
          <SelectTrigger className="w-36"><Filter className="w-3 h-3 mr-1" /><SelectValue placeholder="Semua Kelas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {[1,2,3,4,5,6].map(k => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Semua Bulan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Bulan</SelectItem>
            {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Grafik Kehadiran</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Data Absensi ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Belum ada data absensi</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Bulan</TableHead>
                    <TableHead className="text-center">Hadir</TableHead>
                    <TableHead className="text-center">Sakit</TableHead>
                    <TableHead className="text-center">Izin</TableHead>
                    <TableHead className="text-center">Alfa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(a => {
                    const st = (a as any).students;
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{st?.nama ?? "-"}</TableCell>
                        <TableCell>{st?.kelas ?? "-"}{st?.rombel ?? ""}</TableCell>
                        <TableCell>{MONTH_NAMES[a.month - 1]} {a.year}</TableCell>
                        <TableCell className="text-center text-emerald-600 font-bold">{a.present}</TableCell>
                        <TableCell className="text-center text-amber-600 font-bold">{a.sick}</TableCell>
                        <TableCell className="text-center text-blue-600 font-bold">{a.permission}</TableCell>
                        <TableCell className="text-center text-red-600 font-bold">{a.absent}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendancePage;
