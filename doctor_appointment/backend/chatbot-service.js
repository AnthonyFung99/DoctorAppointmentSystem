const dotenv = require('dotenv');
dotenv.config();

const { Document } = require('langchain/document');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');

const embeddingsModel = new GoogleGenerativeAIEmbeddings({
      model: 'text-embedding-004',  
      apiKey: process.env.GEMINI_API_KEY,
     });



