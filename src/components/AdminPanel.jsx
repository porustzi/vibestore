import { useState, useCallback } from 'react'
import { adminCategories, sizesShoes, sizesClothes } from '../data/catalog'

const ADMIN_PASS = "8934"

const getSizesFor = (cat) => cat === "Кросівки" ? [...sizesShoes] : [...sizesClothes]

const emptyForm = () => ({
  name: "", price: "", category: "", desc: "",
  images: [], sizes: {}
})

export default function AdminPanel({ products, setProducts, saveProducts, onClose }) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [passInput, setPassInput] = useState("")
  const [passError, setPassError] = useState("")
  const [tab, setTab] = useState("list")
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState(null)
  const [imageUrl, setImageUrl] = useState("")
  const [errors, setErrors] = useState({})
  const [search, setSearch] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const handleLogin = () => {
    if (passInput === ADMIN_PASS) {
      setLoggedIn(true)
      setPassError("")
    } else {
      setPassError("Невірний пароль")
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = "Введіть назву"
    if (!form.price || Number(form.price) <= 0) e.price = "Введіть ціну"
    if (!form.category) e.category = "Оберіть категорію"
    if (form.images.length === 0) e.images = "Додайте хоча б одне фото"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCategoryChange = (cat) => {
    const sizes = getSizesFor(cat)
    const avail = {}
    sizes.forEach(s => { avail[s] = true })
    setForm(p => ({ ...p, category: cat, sizes: avail }))
    setErrors(p => ({ ...p, category: undefined }))
  }

  const handleSizeToggle = (size) => {
    setForm(p => ({
      ...p,
      sizes: { ...p.sizes, [size]: !p.sizes[size] }
    }))
  }

  const addImageUrl = () => {
    const url = imageUrl.trim()
    if (!url) return
    if (!url.match(/^https?:\/\//)) {
      setErrors(p => ({ ...p, images: "URL повинен починатись з http:// або https://" }))
      return
    }
    setForm(p => ({ ...p, images: [...p.images, url] }))
    setImageUrl("")
    setErrors(p => ({ ...p, images: undefined }))
  }

  const addImageFile = (files) => {
    const urls = Array.from(files).map(f => URL.createObjectURL(f))
    setForm(p => ({ ...p, images: [...p.images, ...urls] }))
    setErrors(p => ({ ...p, images: undefined }))
  }

  const removeImage = (idx) => {
    setForm(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))
  }

  const moveImage = (from, to) => {
    if (to < 0 || to >= form.images.length) return
    const arr = [...form.images]
    const [item] = arr.splice(from, 1)
    arr.splice(to, 0, item)
    setForm(p => ({ ...p, images: arr }))
  }

  const resetForm = () => {
    setForm(emptyForm())
    setEditingId(null)
    setImageUrl("")
    setErrors({})
  }

  const handleSubmit = () => {
    if (!validate()) return

    const productData = {
      name: form.name.trim(),
      price: form.price,
      category: form.category,
      desc: form.desc.trim(),
      sizes: form.sizes,
      images: form.images,
      currentImageIndex: 0
    }

    let updated
    if (editingId) {
      updated = products.map(p => p.id === editingId ? { ...p, ...productData } : p)
      showToast("Товар оновлено")
    } else {
      updated = [...products, { id: Date.now(), ...productData }]
      showToast("Товар додано")
    }
    setProducts(updated)
    saveProducts(updated)
    resetForm()
    setTab("list")
  }

  const handleEdit = (product) => {
    const sizes = product.sizes
      ? (Array.isArray(product.sizes)
        ? product.sizes.reduce((a, s) => ({ ...a, [s]: true }), {})
        : product.sizes)
      : {}
    setForm({
      name: product.name,
      price: product.price,
      category: product.category,
      desc: product.desc || "",
      sizes,
      images: product.images || []
    })
    setEditingId(product.id)
    setTab("form")
    setErrors({})
  }

  const handleDelete = (id) => {
    setConfirmDelete(id)
  }

  const confirmDeleteAction = () => {
    const updated = products.filter(p => p.id !== confirmDelete)
    setProducts(updated)
    saveProducts(updated)
    if (editingId === confirmDelete) resetForm()
    setConfirmDelete(null)
    showToast("Товар видалено")
  }

  const moveProduct = (id, dir) => {
    const idx = products.findIndex(p => p.id === id)
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= products.length) return
    const arr = [...products]
    const [item] = arr.splice(idx, 1)
    arr.splice(newIdx, 0, item)
    setProducts(arr)
    saveProducts(arr)
  }

  const getAvailableSizes = (product) => {
    if (!product.sizes) return []
    const s = product.sizes
    if (Array.isArray(s)) return s
    return Object.entries(s).filter(([, v]) => v).map(([k]) => k)
  }

  const filteredProducts = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()))
    : products

  if (!loggedIn) {
    return (
      <div className="admin-overlay">
        <div className="admin-login-modal">
          <button className="admin-back-link" onClick={onClose}>← Назад на сайт</button>
          <div className="admin-login-icon">🔐</div>
          <h2 className="admin-login-title">Вхід в адмін-панель</h2>
          <input
            type="password"
            placeholder="Введіть пароль"
            className="admin-input"
            value={passInput}
            onChange={e => { setPassInput(e.target.value); setPassError("") }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            autoFocus
          />
          {passError && <div className="admin-login-error">{passError}</div>}
          <button className="admin-submit" onClick={handleLogin}>Увійти</button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-overlay">
      {toast && <div className="admin-toast">{toast}</div>}
      {confirmDelete && (
        <div className="admin-confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="admin-confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Видалити товар?</h3>
            <p>Цю дію не можна скасувати</p>
            <div className="admin-confirm-actions">
              <button className="admin-cancel-btn" onClick={() => setConfirmDelete(null)}>Скасувати</button>
              <button className="admin-delete-confirm" onClick={confirmDeleteAction}>Видалити</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-full-panel">
        <div className="admin-header">
          <button className="admin-back-link" onClick={onClose}>← Назад на сайт</button>
          <h2 className="admin-title">Панель керування</h2>
          <div className="admin-stats">{products.length} товарів</div>
        </div>

        <div className="admin-tabs">
          <button className={`admin-tab ${tab === "list" ? "active" : ""}`}
            onClick={() => { setTab("list"); resetForm() }}>
            Товари
          </button>
          <button className={`admin-tab ${tab === "form" ? "active" : ""}`}
            onClick={() => { setTab("form"); if (!editingId) resetForm() }}>
            {editingId ? "Редагувати" : "Додати"}
          </button>
        </div>

        {tab === "list" && (
          <div className="admin-list-view">
            <div className="admin-search-wrap">
              <input type="text" placeholder="Пошук товарів..." className="admin-input admin-search"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {filteredProducts.length === 0 ? (
              <div className="admin-empty">
                <p>{search ? "Нічого не знайдено" : "Товарів ще немає"}</p>
                {!search && <button className="admin-submit" style={{ width: "auto", padding: "10px 24px" }}
                  onClick={() => setTab("form")}>Додати перший товар</button>}
              </div>
            ) : (
              <div className="admin-products-list">
                {filteredProducts.map((product, idx) => (
                  <div key={product.id} className="admin-product-item">
                    <img src={product.images?.[0] || "https://via.placeholder.com/50"}
                      alt="" className="admin-product-thumb" />
                    <div className="admin-product-info">
                      <div className="admin-product-name">{product.name}</div>
                      <div className="admin-product-meta">
                        <span className="admin-product-price">{product.price} грн</span>
                        <span className="admin-product-cat">{product.category}</span>
                      </div>
                      <div className="admin-product-sizes">
                        {getAvailableSizes(product).join(", ")}
                      </div>
                    </div>
                    <div className="admin-product-actions">
                      <button className="admin-action-btn up" onClick={() => moveProduct(product.id, -1)}
                        disabled={idx === 0}>↑</button>
                      <button className="admin-action-btn down" onClick={() => moveProduct(product.id, 1)}
                        disabled={idx === products.length - 1}>↓</button>
                      <button className="admin-action-btn edit" onClick={() => handleEdit(product)}>✎</button>
                      <button className="admin-action-btn delete" onClick={() => handleDelete(product.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "form" && (
          <div className="admin-form-view">
            <h3 className="admin-form-title">{editingId ? "Редагувати товар" : "Новий товар"}</h3>

            <div className="admin-field">
              <label>Назва *</label>
              <input type="text" placeholder="Назва товару" className={`admin-input ${errors.name ? "error" : ""}`}
                value={form.name}
                onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: undefined })) }} />
              {errors.name && <span className="admin-field-error">{errors.name}</span>}
            </div>

            <div className="admin-field-row">
              <div className="admin-field">
                <label>Ціна (грн) *</label>
                <input type="number" min="0" placeholder="0" className={`admin-input ${errors.price ? "error" : ""}`}
                  value={form.price}
                  onChange={e => { setForm(p => ({ ...p, price: e.target.value })); setErrors(p => ({ ...p, price: undefined })) }} />
                {errors.price && <span className="admin-field-error">{errors.price}</span>}
              </div>
              <div className="admin-field">
                <label>Категорія *</label>
                <select className={`admin-input ${errors.category ? "error" : ""}`}
                  value={form.category} onChange={e => handleCategoryChange(e.target.value)}>
                  <option value="">Оберіть</option>
                  {adminCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <span className="admin-field-error">{errors.category}</span>}
              </div>
            </div>

            <div className="admin-field">
              <label>Опис</label>
              <textarea placeholder="Опис товару" className="admin-input admin-textarea" rows="3"
                value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} />
            </div>

            {form.category && (
              <div className="admin-field">
                <label>Розміри та наявність</label>
                <div className="admin-sizes-hint">Натисни щоб вимкнути/увімкнути розмір</div>
                <div className="admin-sizes-grid">
                  {getSizesFor(form.category).map(size => (
                    <button key={size}
                      className={`admin-size-btn ${form.sizes[size] !== false ? "active" : "inactive"}`}
                      onClick={() => handleSizeToggle(size)}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="admin-field">
              <label>Фото *</label>
              {errors.images && <span className="admin-field-error">{errors.images}</span>}
              <div className="admin-image-add">
                <input type="text" placeholder="Вставте URL фото..." className="admin-input"
                  value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addImageUrl()} />
                <button className="admin-add-url-btn" onClick={addImageUrl}>+ URL</button>
              </div>
              <div className="admin-image-file-row">
                <input type="file" accept="image/*" multiple style={{ display: "none" }}
                  id="admin-file-input" onChange={e => addImageFile(e.target.files)} />
                <label htmlFor="admin-file-input" className="admin-file-label">📂 Обрати файли</label>
              </div>
              {form.images.length > 0 && (
                <div className="admin-images-grid">
                  {form.images.map((url, idx) => (
                    <div key={idx} className="admin-image-thumb">
                      <img src={url} alt="" onError={e => { e.target.src = "https://via.placeholder.com/80" }} />
                      <div className="admin-image-controls">
                        <button onClick={() => moveImage(idx, idx - 1)} disabled={idx === 0}>‹</button>
                        <button onClick={() => moveImage(idx, idx + 1)} disabled={idx === form.images.length - 1}>›</button>
                        <button className="remove" onClick={() => removeImage(idx)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-form-actions">
              {editingId && <button className="admin-cancel-btn" onClick={() => { resetForm(); setTab("list") }}>Скасувати</button>}
              <button className="admin-submit" onClick={handleSubmit}>
                {editingId ? "Зберегти зміни" : "Додати товар"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
