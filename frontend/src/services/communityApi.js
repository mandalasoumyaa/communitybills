const API_BASE_URL = 'http://127.0.0.1:8000';

export async function fetchOverview(communityId = 1) {
  const res = await fetch(`${API_BASE_URL}/communities/${communityId}/overview`);
  if (!res.ok) throw new Error('Failed to fetch community overview');
  return res.json();
}

export async function fetchCommunities() {
  const res = await fetch(`${API_BASE_URL}/communities`);
  if (!res.ok) throw new Error('Failed to fetch communities');
  return res.json();
}

export async function fetchCommunity(communityId = 1) {
  const res = await fetch(`${API_BASE_URL}/communities/${communityId}`);
  if (!res.ok) throw new Error('Failed to fetch community');
  return res.json();
}

export async function updateCommunity(communityId = 1, data) {
  const res = await fetch(`${API_BASE_URL}/communities/${communityId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update community');
  return res.json();
}

export async function addCommunity(data) {
  const res = await fetch(`${API_BASE_URL}/communities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add community');
  return res.json();
}

export async function deleteCommunity(communityId) {
  const res = await fetch(`${API_BASE_URL}/communities/${communityId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete community');
  return res.json();
}

export async function fetchTowersOverview(communityId = 1) {
  const res = await fetch(`${API_BASE_URL}/communities/${communityId}/towers/overview`);
  if (!res.ok) throw new Error('Failed to fetch towers overview');
  return res.json();
}

export async function fetchTowers(communityId = 1) {
  const res = await fetch(`${API_BASE_URL}/communities/${communityId}/towers`);
  if (!res.ok) throw new Error('Failed to fetch towers');
  return res.json();
}

export async function addTower(data) {
  const res = await fetch(`${API_BASE_URL}/towers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add tower');
  return res.json();
}

export async function updateTower(towerId, data) {
  const res = await fetch(`${API_BASE_URL}/towers/${towerId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update tower');
  return res.json();
}

export async function deleteTower(towerId) {
  const res = await fetch(`${API_BASE_URL}/towers/${towerId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete tower');
  return res.json();
}

export async function fetchFlats(towerId) {
  const res = await fetch(`${API_BASE_URL}/towers/${towerId}/flats`);
  if (!res.ok) throw new Error('Failed to fetch flats');
  return res.json();
}

export async function addFlat(data) {
  const res = await fetch(`${API_BASE_URL}/flats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add flat');
  return res.json();
}

export async function updateFlat(flatId, data) {
  const res = await fetch(`${API_BASE_URL}/flats/${flatId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update flat');
  return res.json();
}

export async function deleteFlat(flatId) {
  const res = await fetch(`${API_BASE_URL}/flats/${flatId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete flat');
  return res.json();
}

export async function fetchWaterReadings(month, search = '', floor = 'All', status = 'All', sortCol = 'apartment_number', sortDir = 'asc', skip = 0, limit = 100) {
  const query = new URLSearchParams({
    month,
    search,
    floor,
    status,
    sort_col: sortCol,
    sort_dir: sortDir,
    skip: skip.toString(),
    limit: limit.toString()
  });
  const res = await fetch(`${API_BASE_URL}/water-readings?${query}`);
  if (!res.ok) throw new Error('Failed to fetch water readings');
  return res.json();
}

export async function addWaterReading(data) {
  const res = await fetch(`${API_BASE_URL}/water-readings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.detail || 'Failed to add water reading');
  }
  return res.json();
}

export async function updateWaterReading(id, data) {
  const res = await fetch(`${API_BASE_URL}/water-readings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update water reading');
  return res.json();
}

export async function deleteWaterReading(id) {
  const res = await fetch(`${API_BASE_URL}/water-readings/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete water reading');
  return res.json();
}

export async function uploadWaterReadingImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE_URL}/upload/image`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to run OCR on image');
  return res.json();
}

export async function uploadWaterReadingsCSV(file, month, rate = 0.575) {
  const formData = new FormData();
  formData.append('file', file);
  const query = new URLSearchParams({ month, rate_per_litre: rate.toString() });
  const res = await fetch(`${API_BASE_URL}/upload/csv?${query}`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.detail || 'Failed to import CSV readings');
  }
  return res.json();
}

export async function generateWaterBills(month, rate = 0.575, maintenance = 250.0) {
  const query = new URLSearchParams({
    month,
    rate_per_litre: rate.toString(),
    maintenance: maintenance.toString()
  });
  const res = await fetch(`${API_BASE_URL}/bills/generate?${query}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to generate water bills');
  return res.json();
}
