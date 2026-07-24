import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParentStudents, useChildrenTeachers } from "@/hooks/useParentStudents";
import { useStudents } from "@/hooks/useSupabaseData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, User } from "lucide-react";
import { Link } from "react-router-dom";

export default function ContactTeacher() {
  const { user } = useAuth();
  const { data: children = [], isLoading: loadingChildren } = useParentStudents(user?.id);
  
  const { data: childrenTeachers = {}, isLoading: loadingTeachers } = useChildrenTeachers(children.map(c => c.id));

  if (loadingChildren || loadingTeachers) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hubungi Guru</h1>
        <p className="text-slate-500 mt-1">
          Daftar kontak Guru Tahsin untuk masing-masing siswa yang terhubung dengan akun Anda.
        </p>
      </div>

      {children.length === 0 ? (
        <Card className="bg-white border-none shadow-sm text-center py-12">
          <CardContent className="flex flex-col items-center pt-6">
            <User className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-600 font-medium text-lg mb-2">Belum ada siswa terhubung</p>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
              Silakan hubungkan profil siswa ke akun Anda di halaman Profil Siswa untuk melihat informasi Guru Tahsin.
            </p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link to="/">Ke Profil Siswa</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {children.map(child => {
            const teacherData = childrenTeachers[child.id];
            const teacherName = teacherData?.name || "Guru Tidak Diketahui";
            const whatsapp = teacherData?.whatsapp;

            const messageTemplate = encodeURIComponent(`Assalamu'alaikum ustadz/ustadzah ${teacherName !== "Guru Tidak Diketahui" ? teacherName : ""}, saya orang tua dari ${child.nama}...`);
            const waLink = whatsapp ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${messageTemplate}` : null;

            return (
              <Card key={child.id} className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-slate-800">{child.nama}</CardTitle>
                  <CardDescription className="text-slate-500">
                    Kelas {child.kelas}{child.rombel} • Level {child.level}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Guru Tahsin</p>
                      <p className="font-semibold text-slate-700 flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-600" />
                        {teacherName}
                      </p>
                    </div>
                    
                    {waLink ? (
                      <Button asChild className="bg-emerald-600 hover:bg-emerald-700 shrink-0 shadow-sm" size="sm">
                        <a href={waLink} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Hubungi
                        </a>
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" disabled className="shrink-0 bg-slate-200 text-slate-500">
                        Nomor Tidak Tersedia
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
