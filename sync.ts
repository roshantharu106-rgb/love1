import { supabase } from './supabase';

export const syncService = {
  /**
   * Pushes data to Supabase
   */
  push: async (year: string, key: string, data: any) => {
    if (!supabase) return;

    try {
      // 1. Save to the generic app_entries table (JSON blob)
      const { error: entryError } = await supabase
        .from('app_entries')
        .upsert({ 
          id: `${year}_${key}`,
          year, 
          key, 
          data, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'id' });

      if (entryError) {
        console.error(`Sync Error (Push ${key} to app_entries):`, entryError.message);
      }

      // 2. If the key is 'marks', also save to the structured marks_data table
      if (key === 'marks' && Array.isArray(data)) {
        const marksToInsert = data.map((m: any) => ({
          academic_year: year,
          class_id: m.classId,
          student_id: m.studentId,
          subject_id: m.subjectId,
          term: m.term,
          marks_obtained: m.marksObtained,
          max_marks: m.maxMarks,
          updated_at: new Date().toISOString()
        }));

        const { error: marksError } = await supabase
          .from('marks_data')
          .upsert(marksToInsert, { 
            onConflict: 'academic_year,student_id,subject_id,term' 
          });

        if (marksError) {
          console.error(`Sync Error (Push to marks_data):`, marksError.message);
        }
      }

      // 2.5. If the key is 'students', also save to the structured students_data table
      if (key === 'students' && Array.isArray(data)) {
        const studentsToInsert = data.map((s: any) => ({
          id: s.id,
          academic_year: year,
          name: s.name,
          roll_number: s.rollNumber,
          current_class: s.currentClass,
          father_name: s.fatherName,
          contact_number: s.contactNumber,
          gmail: s.gmail,
          address: s.address,
          admission_date: s.admissionDate,
          gender: s.gender,
          profile_picture: s.profilePicture,
          commute_mode: s.commuteMode,
          username: s.username,
          password: s.password,
          updated_at: new Date().toISOString()
        }));

        const { error: studentsError } = await supabase
          .from('students_data')
          .upsert(studentsToInsert, { 
            onConflict: 'academic_year,id' 
          });

        if (studentsError) {
          console.error(`Sync Error (Push to students_data):`, studentsError.message);
        }
      }

      // 3. If the key is 'teachers', also save to the structured teachers_data table
      if (key === 'teachers' && Array.isArray(data)) {
        const teachersToInsert = data.map((t: any) => ({
          id: t.id,
          academic_year: year,
          name: t.name,
          gender: t.gender,
          contact_number: t.contactNumber,
          gmail: t.gmail,
          address: t.address,
          join_date: t.joinDate,
          profile_picture: t.profilePicture,
          class_teacher_of: t.classTeacherOf,
          assignments: t.assignments || [],
          updated_at: new Date().toISOString()
        }));

        const { error: teachersError } = await supabase
          .from('teachers_data')
          .upsert(teachersToInsert, { 
            onConflict: 'academic_year,id' 
          });

        if (teachersError) {
          console.error(`Sync Error (Push to teachers_data):`, teachersError.message);
        }
      }

      // 4. If the key is 'salary', also save to the structured salary_data table
      if (key === 'salary' && Array.isArray(data)) {
        const salaryToInsert = data.map((s: any) => ({
          id: s.id,
          teacher_id: s.teacherId,
          academic_year: year,
          amount: s.amount,
          month: s.month,
          payment_date: s.paymentDate,
          remarks: s.remarks,
          updated_at: new Date().toISOString()
        }));

        const { error: salaryError } = await supabase
          .from('salary_data')
          .upsert(salaryToInsert, { 
            onConflict: 'id' 
          });

        if (salaryError) {
          console.error(`Sync Error (Push to salary_data):`, salaryError.message);
        }
      }

      // 5. If the key is 'expenditures', also save to the structured expenditures_data table
      if (key === 'expenditures' && Array.isArray(data)) {
        const expendituresToInsert = data.map((e: any) => ({
          id: e.id,
          academic_year: year,
          description: e.description,
          category: e.category,
          amount: e.amount,
          date: e.date,
          remarks: e.remarks,
          updated_at: new Date().toISOString()
        }));

        const { error: expError } = await supabase
          .from('expenditures_data')
          .upsert(expendituresToInsert, { 
            onConflict: 'id' 
          });

        if (expError) {
          console.error(`Sync Error (Push to expenditures_data):`, expError.message);
        }
      }

      // 6. If the key is 'attendance', also save to the structured attendance_data table
      if (key === 'attendance' && Array.isArray(data)) {
        const attendanceToInsert = data.map((a: any) => ({
          id: a.id,
          student_id: a.studentId,
          class_id: a.classId,
          academic_year: a.year,
          month: a.month,
          day: a.day,
          status: a.status,
          updated_at: new Date().toISOString()
        }));

        const { error: attError } = await supabase
          .from('attendance_data')
          .upsert(attendanceToInsert, { 
            onConflict: 'id' 
          });

        if (attError) {
          console.error(`Sync Error (Push to attendance_data):`, attError.message);
        }
      }

      // 7. If the key is 'invoices', also save to the structured invoices_data table
      if (key === 'invoices' && Array.isArray(data)) {
        const invoicesToInsert = data.map((i: any) => ({
          id: i.id,
          student_id: i.studentId,
          academic_year: year,
          amount: i.amount,
          month: i.month,
          date: i.date,
          status: i.status,
          type: i.type,
          updated_at: new Date().toISOString()
        }));

        const { error: invError } = await supabase
          .from('invoices_data')
          .upsert(invoicesToInsert, { 
            onConflict: 'id' 
          });

        if (invError) {
          console.error(`Sync Error (Push to invoices_data):`, invError.message);
        }
      }
    } catch (err) {
      console.error('Sync Exception:', err);
    }
  },

  /**
   * Pulls data from Supabase
   */
  pull: async (year: string, key: string) => {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('app_entries')
        .select('data')
        .eq('id', `${year}_${key}`)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found is fine
          console.error(`Sync Error (Pull ${key}):`, error.message);
        }
        return null;
      }

      return data?.data;
    } catch (err) {
      console.error('Sync Exception:', err);
      return null;
    }
  },

  /**
   * Pulls all data for a specific year
   */
  pullYear: async (year: string) => {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('app_entries')
        .select('key, data')
        .eq('year', year);

      if (error) {
        console.error(`Sync Error (Pull Year ${year}):`, error.message);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Sync Exception:', err);
      return null;
    }
  }
};
