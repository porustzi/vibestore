const DEFAULT_PRODUCTS = [
  {"id":1,"name":"Товар 1","price":"3 200","desc":"Преміальний комфорт та футуристичний силует.","sizes":["37","38","39","40","41","42","43","44","45"],"category":"Кросівки","images":["https://via.placeholder.com/150"],"currentImageIndex":0,"topDrop":true},
  {"id":2,"name":"Товар 2","price":"5 700","desc":"Масивний дизайн у стилі нульових.","sizes":["37","38","39","40","41","42","43","44","45"],"category":"Кросівки","images":["https://via.placeholder.com/150"],"currentImageIndex":0,"topDrop":true},
  {"id":3,"name":"Товар 3","price":"5 000","desc":"Спортивна естетика в деконструйованому стилі.","sizes":["37","38","39","40","41","42","43","44","45"],"category":"Кросівки","images":["https://via.placeholder.com/150"],"currentImageIndex":0,"topDrop":true},
  {"id":4,"name":"Товар 4","price":"1 800","desc":"Джинси клёш з ідеальною посадкою.","sizes":["S","M","L","XL"],"category":"Штани та джинси","images":["https://via.placeholder.com/150"],"currentImageIndex":0},
  {"id":5,"name":"Товар 5","price":"2 600","desc":"Класичний світшот з м'якої бавовни.","sizes":["S","M","L","XL"],"category":"Худі та світшоти","images":["https://via.placeholder.com/150"],"currentImageIndex":0},
  {"id":6,"name":"Товар 6","price":"4 200","desc":"Вінтажні кросівки зธรรมних матеріалів.","sizes":["37","38","39","40","41","42","43","44","45"],"category":"Кросівки","images":["https://via.placeholder.com/150"],"currentImageIndex":0},
  {"id":7,"name":"Товар 7","price":"450","desc":"Яскраві шкарпетки з унікальним принтом.","sizes":["S","M","L","XL"],"category":"Шкарпетки","images":["https://via.placeholder.com/150"],"currentImageIndex":0},
  {"id":8,"name":"Товар 8","price":"450","desc":"Базові шкарпетки преміум якості.","sizes":["S","M","L","XL"],"category":"Шкарпетки","images":["https://via.placeholder.com/150"],"currentImageIndex":0},
  {"id":9,"name":"Товар 9","price":"3 400","desc":"Оверсайз худі з нашивкою.","sizes":["S","M","L","XL"],"category":"Худі та світшоти","images":["https://via.placeholder.com/150"],"currentImageIndex":0},
  {"id":10,"name":"Товар 10","price":"2 100","desc":"Мінімалістичний світшот для щоденного носіння.","sizes":["S","M","L","XL"],"category":"Худі та світшоти","images":["https://via.placeholder.com/150"],"currentImageIndex":0}
]

export async function onRequestGet(context) {
  const kv = context.env.PRODUCTS_KV
  let products = null
  try {
    const raw = await kv.get('products', 'json')
    if (raw && Array.isArray(raw) && raw.length > 0) products = raw
  } catch {}
  if (!products) products = DEFAULT_PRODUCTS
  return new Response(JSON.stringify(products), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  })
}

export async function onRequestPost(context) {
  const kv = context.env.PRODUCTS_KV
  const body = await context.request.json()
  const products = body.products
  if (!products || !Array.isArray(products)) {
    return new Response(JSON.stringify({ error: 'Invalid data' }), { status: 400 })
  }
  await kv.put('products', JSON.stringify(products))
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  })
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
