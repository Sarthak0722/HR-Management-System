import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Send, HelpCircle, FileText, AlertCircle } from 'lucide-react';
import { QAResponse } from '../types';

const qaSchema = z.object({
  question: z.string().min(1, 'Please enter a question'),
});

type QAForm = z.infer<typeof qaSchema>;

const QA: React.FC = () => {
  const [response, setResponse] = useState<QAResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QAForm>({
    resolver: zodResolver(qaSchema),
  });

  const onSubmit = async (data: QAForm) => {
    setLoading(true);
    try {
      const result = await api.rag.askQuestion(data.question);
      setResponse(result.data);
      reset();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  const exampleQuestions = [
    "What is the leave policy?",
    "How many vacation days do I get?",
    "What is the dress code?",
    "How do I request sick leave?",
    "What are the work hours?",
    "What benefits are available?",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">HR Assistant</h1>
        <p className="text-gray-600">
          Ask questions about HR policies and get instant answers powered by AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Ask a Question</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="question" className="block text-sm font-medium text-gray-700">
                    Your Question
                  </label>
                  <textarea
                    {...register('question')}
                    rows={4}
                    className={`input mt-1 ${errors.question ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    placeholder="Ask about HR policies, leave procedures, benefits, etc."
                  />
                  {errors.question && (
                    <p className="mt-1 text-sm text-red-600">{errors.question.message}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Getting Answer...' : 'Ask Question'}
                </button>
              </form>
            </div>
          </div>

          {/* Response */}
          {response && (
            <div className="card mt-6">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Answer</h3>
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full mr-2 ${
                      response.confidence > 0.7 ? 'bg-green-500' : 
                      response.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-gray-500">
                      Confidence: {Math.round(response.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{response.answer}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Example Questions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Example Questions</h3>
            </div>
            <div className="card-body">
              <div className="space-y-2">
                {exampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      reset({ question });
                      handleSubmit(onSubmit)();
                    }}
                    className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sources */}
          {response && response.sources.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Sources</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  {response.sources.map((source) => (
                    <div key={source.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start">
                        <FileText className="h-4 w-4 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{source.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{source.category}</p>
                          <p className="text-xs text-gray-600 mt-2 line-clamp-3">
                            {source.content.substring(0, 150)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Tips</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex items-start">
                  <HelpCircle className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    Be specific with your questions for better answers.
                  </p>
                </div>
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    The AI is trained on HR policies and may not have all information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QA;
