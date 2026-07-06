import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

const envFile = fs.readFileSync('.env', 'utf-8')
const env: Record<string, string> = {}
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=')
  if (key && rest.length > 0) {
    env[key.trim()] = rest.join('=').replace(/^"|"$/g, '').trim()
  }
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id, name, class_type')
    
  if (studentError) {
    console.error('Error querying students:', studentError.message)
    return
  }
  
  const studentMap = new Map(students.map(s => [s.id, s]))

  const { data, error } = await supabase
    .from('monthly_reports')
    .select('month, year, student_id, jilid')

  if (error) {
    console.error('Error querying monthly_reports:', error.message)
    return
  }
  
  const m = data.filter(d => d.month === 5 && d.year === 2026)
  const j = data.filter(d => d.month === 6 && d.year === 2026)
  
  console.log('May 2026 total reports:', m.length)
  console.log('June 2026 total reports:', j.length)
  
  const mayIqra = m.filter(d => studentMap.get(d.student_id)?.class_type?.toLowerCase().includes('iqra')).length
  const mayTahsin = m.filter(d => studentMap.get(d.student_id)?.class_type?.toLowerCase().includes('tahsin lanjutan')).length
  
  const juneIqra = j.filter(d => studentMap.get(d.student_id)?.class_type?.toLowerCase().includes('iqra')).length
  const juneTahsin = j.filter(d => studentMap.get(d.student_id)?.class_type?.toLowerCase().includes('tahsin lanjutan')).length
  
  console.log('May Iqra reports:', mayIqra)
  console.log('May Tahsin Lanjutan reports:', mayTahsin)
  console.log('June Iqra reports:', juneIqra)
  console.log('June Tahsin Lanjutan reports:', juneTahsin)
}

check()
