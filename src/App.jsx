import React, { useEffect, useRef, useState } from "react"
import Send from "./Send"
import star1 from "./assets/star-1.svg"
import star2 from "./assets/star-2.svg"
import star3 from "./assets/star-3.svg"

// Call server-side AI endpoint
const callServerAI = async (messages) => {
  const resp = await fetch("http://localhost:3001/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Server error: ${text}`)
  }

  const data = await resp.json()
  return data.reply
}

const TypingIndicator = () => (
  <div className="typing">
    <span className="dot" />
    <span className="dot" />
    <span className="dot" />
  </div>
)

const MessageBubble = ({ message }) => {
  const isUser = message.role === "user"
  return (
    <div className={`message-row ${isUser ? "user" : "assistant"}`}>
      <div className={`bubble ${isUser ? "bubble-user" : "bubble-assistant"}`}>
        {message.content}
      </div>
    </div>
  )
}

export default function App() {
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const messagesRef = useRef(null)
  const nextIdRef = useRef(1)

  const suggestions = [
    "What can I ask you to do?",
    "Which one of my projects is performing the best?",
    "What projects should I be concerned about right now?",
  ]

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const pushMessage = (role, content) => {
    const msg = { id: nextIdRef.current++, role, content }
    setMessages((m) => [...m, msg])
    return msg
  }

  const handleSuggestionClick = (s) => setInputValue(s)
  const handleInputChange = (e) => setInputValue(e.target.value)

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    const trimmed = inputValue.trim()
    if (!trimmed) return
    setError(null)
    setSubmitting(true)
    pushMessage("user", trimmed)
    setInputValue("")
    setIsTyping(true)

    try {
      const reply = await callServerAI([...messages, { role: "user", content: trimmed }])
      pushMessage("assistant", reply)
    } catch (err) {
      console.error("chat error", err)
      setError("Failed to get response from server")
      pushMessage("assistant", "Sorry — there was an error getting a response.")
    } finally {
      setIsTyping(false)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] p-6">
      <div className="relative w-[1180px] h-[700px] bg-white rounded-3xl shadow-md overflow-hidden">
        {/* header */}
        <header className="absolute top-8 left-0 right-0 flex flex-col items-center z-10">
          <div className="relative w-9 h-9 mb-3" aria-hidden>
            <img src={star1} alt="" className="absolute left-0 top-3 w-5 h-5" />
            <img src={star3} alt="" className="absolute left-4 top-2 w-5 h-5" />
            <img src={star2} alt="" className="absolute left-0 top-0 w-5 h-5" />
          </div>
          <h1 className="text-[#160211] text-base">Ask our AI anything</h1>
        </header>

        {/* chat messages */}
        <div
          ref={messagesRef}
          className="absolute top-28 bottom-48 left-8 right-8 overflow-y-auto flex flex-col gap-3 pb-20"
        >
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>

        {/* suggestions + input */}
        <div className="absolute left-12 right-12 bottom-12">
          <div className="mb-4">
            <h2 className="text-xs font-semibold text-[#56637e] mb-3">
              Suggestions on what to ask Our AI
            </h2>
            <div className="flex gap-3">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggestionClick(s)}
                  className="text-sm text-[#160211] bg-white/80 border border-white rounded-md px-4 py-2 shadow-sm hover:bg-white transition w-[280px] text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center bg-white rounded-full border border-[rgba(22,2,17,0.08)] shadow-sm px-4 py-2"
            aria-label="Chat input form"
          >
            <label htmlFor="chat-input" className="sr-only">
              Ask me anything about your projects
            </label>
            <input
              id="chat-input"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Ask me anything about your projects"
              disabled={submitting}
              className="flex-1 text-sm text-[#56637e] placeholder-[#56637e] bg-transparent outline-none px-2"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={submitting}
              className="w-9 h-9 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
