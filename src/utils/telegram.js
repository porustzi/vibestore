const BOT_TOKEN = "8224617289:AAGNq-Iy02pFejnEH0pSLnPtriE_P6WhcQ4"
const CHAT_ID = "6579794670"

export const sendOrderPhoto = async (photoFile, caption) => {
  try {
    const formData = new FormData()
    formData.append("chat_id", CHAT_ID)
    formData.append("photo", photoFile)
    formData.append("caption", caption)
    formData.append("parse_mode", "HTML")

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`
    await fetch(url, { method: "POST", body: formData })
  } catch (err) {
    console.error("Telegram send photo error:", err)
  }
}

export const getManagerLink = (phone, totalSum) => {
  const num = phone || "номер не вказано"
  const text = `Вітаю! Хочу замовити товари з кошика на суму ${totalSum} грн. Мій номер: ${num}`
  return `https://t.me/vibestore_manager?text=${encodeURIComponent(text)}`
}
