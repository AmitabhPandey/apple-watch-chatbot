import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  console.log('Test route called')
  
  try {
    console.log('Environment check:')
    console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY)
    console.log('GEMINI_API_KEY starts with:', process.env.GEMINI_API_KEY?.substring(0, 10))
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'No API key found' }, { status: 500 })
    }
    
    console.log('Initializing GoogleGenerativeAI...')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    
    console.log('Getting model...')
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    console.log('Making test API call...')
    const result = await model.generateContent('Hello, can you respond with just "API working"?')
    const response = await result.response
    const text = response.text()
    
    console.log('Success! Response:', text)
    
    return NextResponse.json({ 
      success: true, 
      response: text,
      apiKeyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10)
    })
    
  } catch (error) {
    console.error('Test API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message,
        stack: error.stack 
      }, { status: 500 })
    }
    
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 })
  }
}
