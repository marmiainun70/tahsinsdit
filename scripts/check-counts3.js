import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://jmvfudupywneitjiwccy.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptdmZ1ZHVweXduZWl0aml3Y2N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDYxMDIsImV4cCI6MjA4ODUyMjEwMn0.Cp1ee9rbVGlE1JAW4pMRo3XhIvZTH73USUkNcQsg4aM"
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  console.log("Querying students...")
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id, name, class_type')
    
  if (studentError) {
    console.error('Error querying students:', studentError.message)
    return
  }
  
  const studentMap = new Map(students.map(s => [s.id, s]))

  console.log("Querying monthly_reports...")
  const { data, error } = await supabase
    .from('monthly_reports')
    .select('month, year, student_id, jilid')

  if (error) {
    console.error('Error querying monthly_reports:', error.message)
    return
  }
  
  const april = data.filter(d => d.month === 4 && d.year === 2026)
  const may = data.filter(d => d.month === 5 && d.year === 2026)
  
  console.log('April 2026 total reports:', april.length)
  console.log('May 2026 total reports:', may.length)
  
  const aprilIqra = april.filter(d => {
      const type = studentMap.get(d.student_id)?.class_type?.toLowerCase() || '';
      return type.includes('iqra')
  }).length
  const aprilTahsin = april.filter(d => {
      const type = studentMap.get(d.student_id)?.class_type?.toLowerCase() || '';
      return type.includes('tahsin lanjutan') || type === 'tahsin lanjutan'
  }).length
  
  const mayIqra = may.filter(d => {
      const type = studentMap.get(d.student_id)?.class_type?.toLowerCase() || '';
      return type.includes('iqra')
  }).length
  const mayTahsin = may.filter(d => {
      const type = studentMap.get(d.student_id)?.class_type?.toLowerCase() || '';
      return type.includes('tahsin lanjutan') || type === 'tahsin lanjutan'
  }).length
  
  console.log('April Iqra reports:', aprilIqra)
  console.log('April Tahsin Lanjutan reports:', aprilTahsin)
  console.log('May Iqra reports:', mayIqra)
  console.log('May Tahsin Lanjutan reports:', mayTahsin)
}

check()
