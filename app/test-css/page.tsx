export default function TestCSS() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-red-600 mb-4">CSS Test Page</h1>
        <p className="text-gray-700 mb-4">If you can see this styled text, CSS is working!</p>
        <div className="space-y-2">
          <div className="bg-green-100 p-2 rounded">Green background</div>
          <div className="bg-yellow-100 p-2 rounded">Yellow background</div>
          <div className="bg-purple-100 p-2 rounded">Purple background</div>
        </div>
        <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Test Button
        </button>
      </div>
    </div>
  )
} 