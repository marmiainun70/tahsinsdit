import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://jmvfudupywneitjiwccy.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptdmZ1ZHVweXduZWl0aml3Y2N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDYxMDIsImV4cCI6MjA4ODUyMjEwMn0.Cp1ee9rbVGlE1JAW4pMRo3XhIvZTH73USUkNcQsg4aM"
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id, level')
    
  if (studentError) {
    console.error('Error querying students:', studentError.message)
    return
  }
  
  const studentMap = new Map(students.map(s => [s.id, s]))

  const { data: reports, error } = await supabase
    .from('monthly_reports')
    .select('*')

  if (error) {
    console.error('Error querying monthly_reports:', error.message)
    return
  }
  
  if (reports.length > 0) {
      console.log('Report columns:', Object.keys(reports[0]))
  }
  
  const april = reports.filter(d => d.month === 4 && d.year === 2026)
  const may = reports.filter(d => d.month === 5 && d.year === 2026)
  
  console.log('April 2026 total reports:', april.length)
  console.log('May 2026 total reports:', may.length)
  
  const getLevel = (student_id) => {
      return (studentMap.get(student_id)?.level || '').toLowerCase()
  }
  
  const aprilIqra = april.filter(d => getLevel(d.student_id).includes('iqra')).length
  const aprilTahsin = april.filter(d => getLevel(d.student_id).includes('tahsin lanjutan') || getLevel(d.student_id) === 'tahsin lanjutan').length
  const aprilTahsinOnly = april.filter(d => getLevel(d.student_id) === 'tahsin').length
  
  const mayIqra = may.filter(d => getLevel(d.student_id).includes('iqra')).length
  const mayTahsin = may.filter(d => getLevel(d.student_id).includes('tahsin lanjutan') || getLevel(d.student_id) === 'tahsin lanjutan').length
  const mayTahsinOnly = may.filter(d => getLevel(d.student_id) === 'tahsin').length
  
  console.log('April Iqra:', aprilIqra, 'Tahsin Lanjutan:', aprilTahsin, 'Tahsin:', aprilTahsinOnly)
  console.log('May Iqra:', mayIqra, 'Tahsin Lanjutan:', mayTahsin, 'Tahsin:', mayTahsinOnly)
  
  // also check how many students we have directly
  const allIqra = students.filter(s => (s.level||'').toLowerCase().includes('iqra')).length
  const allTahsin = students.filter(s => (s.level||'').toLowerCase().includes('tahsin lanjutan')).length
  console.log('All students - Iqra:', allIqra, 'Tahsin Lanjutan:', allTahsin)
}

check()
