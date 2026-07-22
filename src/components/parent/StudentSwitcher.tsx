import React from "react";
import { ChevronDown, Plus } from "lucide-react";
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
  activeChild: Child;
  onSwitch: (id: string) => void;
}

export const StudentSwitcher: React.FC<StudentSwitcherProps> = ({ childrenList, activeChild, onSwitch }) => {
  if (childrenList.length <= 1) {
    return (
      <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border shadow-sm">
        <div className="w-10 h-10 shrink-0">
          <StudentAvatar gender={activeChild.jenis_kelamin || "L"} />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-slate-900">{activeChild.nama}</span>
          <span className="text-xs text-slate-500">Kelas {activeChild.kelas}{activeChild.rombel}</span>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border shadow-sm hover:bg-slate-50 transition-colors">
          <div className="w-10 h-10 shrink-0">
            <StudentAvatar gender={activeChild.jenis_kelamin || "L"} />
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="font-semibold text-sm text-slate-900 line-clamp-1 max-w-[150px]">{activeChild.nama}</span>
            <span className="text-xs text-slate-500">Kelas {activeChild.kelas}{activeChild.rombel}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px] rounded-xl p-2">
        {childrenList.map(child => (
          <DropdownMenuItem 
            key={child.id}
            onClick={() => onSwitch(child.id)}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${activeChild.id === child.id ? 'bg-emerald-50' : ''}`}
          >
            <div className="w-10 h-10 shrink-0">
              <StudentAvatar gender={child.jenis_kelamin || "L"} />
            </div>
            <div className="flex flex-col flex-1">
              <span className="font-semibold text-sm text-slate-900 line-clamp-1">{child.nama}</span>
              <span className="text-xs text-slate-500">Kelas {child.kelas}{child.rombel} • {child.level}</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem className="p-3 rounded-lg text-emerald-600 font-medium cursor-pointer flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Hubungkan Siswa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
