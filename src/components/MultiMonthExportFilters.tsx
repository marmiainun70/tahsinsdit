import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MONTH_NAMES } from '@/hooks/useMultiMonthReports';
import { Calendar, X } from 'lucide-react';

interface MultiMonthExportFiltersProps {
  onMonthsChange: (months: number[]) => void;
  onYearChange: (year: number) => void;
  selectedMonths: number[];
  selectedYear: number;
}

const YEARS = [2024, 2025, 2026, 2027, 2028];
const MAX_MONTHS = 3;

export const MultiMonthExportFilters = ({
  onMonthsChange,
  onYearChange,
  selectedMonths,
  selectedYear,
}: MultiMonthExportFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMonth = (month: number) => {
    let newMonths = [...selectedMonths];
    if (newMonths.includes(month)) {
      newMonths = newMonths.filter(m => m !== month);
    } else if (newMonths.length < MAX_MONTHS) {
      newMonths.push(month);
      newMonths.sort((a, b) => a - b);
    }
    onMonthsChange(newMonths);
  };

  const clearMonths = () => {
    onMonthsChange([]);
  };

  const selectedMonthLabels = selectedMonths
    .map(m => MONTH_NAMES[m - 1])
    .join(', ');

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tahun Selection */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Tahun</Label>
            <Select value={String(selectedYear)} onValueChange={(v) => onYearChange(Number(v))}>
              <SelectTrigger className="h-10 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulan Selection */}
          <div className="md:col-span-2">
            <Label className="text-sm font-semibold mb-2 block">Bulan (Pilih 1-3)</Label>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full h-10 justify-start text-left bg-white border-gray-300 hover:bg-gray-50"
                onClick={() => setIsOpen(!isOpen)}
              >
                <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                {selectedMonths.length === 0
                  ? 'Pilih bulan...'
                  : `${selectedMonths.length} bulan terpilih: ${selectedMonthLabels}`}
              </Button>

              {/* Month Picker Dropdown */}
              {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {MONTH_NAMES.map((month, idx) => {
                      const monthNum = idx + 1;
                      const isSelected = selectedMonths.includes(monthNum);
                      const isDisabled = selectedMonths.length >= MAX_MONTHS && !isSelected;

                      return (
                        <label
                          key={monthNum}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                            isDisabled
                              ? 'opacity-50 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-100 border border-blue-400'
                              : 'hover:bg-gray-100 border border-transparent'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => toggleMonth(monthNum)}
                            className="w-4 h-4"
                          />
                          <span className={`text-xs sm:text-sm font-medium ${
                            isSelected ? 'text-blue-700' : 'text-gray-700'
                          }`}>
                            {month.substring(0, 3)}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                    {selectedMonths.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 text-xs h-8"
                        onClick={clearMonths}
                      >
                        <X className="w-3 h-3 mr-1" /> Bersihkan
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 ml-auto"
                      onClick={() => setIsOpen(false)}
                    >
                      Tutup
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Message */}
        {selectedMonths.length === 0 && (
          <div className="mt-3 p-2 bg-blue-100 border border-blue-300 rounded text-xs text-blue-800 flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            Pilih 1-3 bulan untuk membuat laporan multi-bulan
          </div>
        )}

        {selectedMonths.length > 0 && (
          <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded text-xs text-green-800 flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            {selectedMonths.length} bulan dipilih: Periode {MONTH_NAMES[selectedMonths[0] - 1]} -
            {' '}{MONTH_NAMES[selectedMonths[selectedMonths.length - 1] - 1]} {selectedYear}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
