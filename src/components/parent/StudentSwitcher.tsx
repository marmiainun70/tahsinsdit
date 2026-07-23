import React from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { StudentAvatar } from "./StudentAvatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface Child {
  id: string;
  nama: string;
  kelas: number;
  rombel: string;
  level: string;
  jenis_kelamin?: string;
}

interface StudentSwitcherProps {
  childrenList: Child[];
  activeChild: Child | null;
  onSwitch: (id: string) => void;
  onAddStudent: () => void;
  onRemoveStudent: (id: string) => void;
}

export const StudentSwitcher: React.FC<StudentSwitcherProps> = ({ 
  childrenList, 
  activeChild, 
  onSwitch,
  onAddStudent,
  onRemoveStudent
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border shadow-sm hover:bg-slate-50 transition-colors">
          {activeChild ? (
            <>
              <div className="w-10 h-10 shrink-0">
                <StudentAvatar gender={activeChild.jenis_kelamin || "L"} />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold text-sm text-slate-900 line-clamp-1 max-w-[150px]">{activeChild.nama}</span>
                <span className="text-xs text-slate-500">Kelas {activeChild.kelas}{activeChild.rombel}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900">Pilih Siswa</span>
            </div>
          )}
          <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[260px] rounded-xl p-2">
        {childrenList.map(child => (
          <div key={child.id} className={`flex items-center group p-1 rounded-lg ${activeChild?.id === child.id ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
            <DropdownMenuItem 
              onClick={() => onSwitch(child.id)}
              className="flex items-center gap-3 flex-1 rounded-lg cursor-pointer bg-transparent focus:bg-transparent"
            >
              <div className="w-10 h-10 shrink-0">
                <StudentAvatar gender={child.jenis_kelamin || "L"} />
              </div>
              <div className="flex flex-col flex-1">
                <span className="font-semibold text-sm text-slate-900 line-clamp-1">{child.nama}</span>
                <span className="text-xs text-slate-500">Kelas {child.kelas}{child.rombel} • {child.level}</span>
              </div>
            </DropdownMenuItem>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemoveStudent(child.id);
              }}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              title="Hapus akses ke siswa ini"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {childrenList.length > 0 && <DropdownMenuSeparator className="my-2" />}
        <DropdownMenuItem 
          onClick={onAddStudent}
          className="p-3 rounded-lg text-emerald-600 font-medium cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Hubungkan Siswa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
