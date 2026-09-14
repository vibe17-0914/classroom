const API_BASE = '/api';

export async function fetchStocks() {
  const res = await fetch(`${API_BASE}/stocks`);
  const data = await res.json();
  return data.stocks || [];
}

export async function fetchStockChart(code) {
  const res = await fetch(`${API_BASE}/stocks/${code}/chart`);
  const data = await res.json();
  return data.chart || [];
}

export async function searchStock(code) {
  const res = await fetch(`${API_BASE}/stocks/search/${code}`);
  return await res.json();
}

export async function addStock(stockData) {
  const res = await fetch(`${API_BASE}/stocks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stockData)
  });
  return await res.json();
}

export async function updateStock(code, updateData) {
  const res = await fetch(`${API_BASE}/stocks/${code}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  return await res.json();
}

export async function updateStockPrice(code, price, reason = '', options = {}) {
  const res = await fetch(`${API_BASE}/stocks/${code}/price`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ price, reason, ...options })
  });
  return await res.json();
}

export async function triggerFluctuation(code = null, force = true) {
  const res = await fetch(`${API_BASE}/stocks/fluctuate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, force })
  });
  return await res.json();
}

export async function deleteStock(code) {
  const res = await fetch(`${API_BASE}/stocks/${code}`, {
    method: 'DELETE'
  });
  return await res.json();
}

export async function restoreDefaultStocks() {
  const res = await fetch(`${API_BASE}/stocks/restore`, {
    method: 'POST'
  });
  return await res.json();
}

export async function fetchStudents() {
  const res = await fetch(`${API_BASE}/students`);
  const data = await res.json();
  return data.students || [];
}

export async function fetchStudent(id) {
  const res = await fetch(`${API_BASE}/students/${id}`);
  const data = await res.json();
  return data.student || null;
}

export async function loginStudent(identifier, pin) {
  const res = await fetch(`${API_BASE}/students/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId: identifier, pin })
  });
  return await res.json();
}

export async function updateStudentPin(id, pin) {
  const res = await fetch(`${API_BASE}/students/${id}/pin`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin })
  });
  return await res.json();
}

export async function resetStudentPin(id) {
  const res = await fetch(`${API_BASE}/students/${id}/reset-pin`, {
    method: 'POST'
  });
  return await res.json();
}

export async function resetAllStudentPins() {
  const res = await fetch(`${API_BASE}/students/reset-all-pins`, {
    method: 'POST'
  });
  return await res.json();
}

export async function addStudent(studentData) {
  const res = await fetch(`${API_BASE}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData)
  });
  return await res.json();
}

export async function batchAddStudents(namesText, seedMoney) {
  const res = await fetch(`${API_BASE}/students/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ namesText, seedMoney })
  });
  return await res.json();
}

export async function updateStudent(id, studentData) {
  const res = await fetch(`${API_BASE}/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData)
  });
  return await res.json();
}

export async function deleteStudent(id) {
  const res = await fetch(`${API_BASE}/students/${id}`, {
    method: 'DELETE'
  });
  return await res.json();
}

export async function syncStudentsWithServer(students) {
  try {
    const res = await fetch(`${API_BASE}/students/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students })
    });
    return await res.json();
  } catch (err) {
    console.error('syncStudentsWithServer error:', err);
    return { success: false };
  }
}

export async function resetStudents(studentId = null, seedMoney = null) {
  const res = await fetch(`${API_BASE}/students/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, seedMoney })
  });
  return await res.json();
}

export async function executeTrade(tradeData) {
  const res = await fetch(`${API_BASE}/trade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tradeData)
  });
  return await res.json();
}

export async function fetchLeaderboard() {
  const res = await fetch(`${API_BASE}/leaderboard`);
  const data = await res.json();
  return data.leaderboard || [];
}

export async function loginAdmin(password) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  return await res.json();
}

export async function fetchAdminSettings() {
  const res = await fetch(`${API_BASE}/admin/settings`);
  const data = await res.json();
  return data.settings || {};
}

export async function updateAdminSettings(settings) {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  return await res.json();
}
