'use client'

import { useState } from 'react'
import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Apple Watch Assistant
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Your intelligent companion for everything Apple Watch. Ask me about features, 
            specifications, troubleshooting, health tracking, and more!
          </p>
        </div>
        <ChatInterface />
      </div>
    </main>
  )
}
