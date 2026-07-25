from flask import Flask, render_template, request, jsonify
from duckduckgo_search import DDGS
from groq import Groq
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
import os
from pathlib import Path
app = Flask(__name__)
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)
groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=groq_api_key)

@app.route("/")
def home():
    return render_template("index.html")

def search_web(query):
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=8, backend="lite"))
        return results
    except Exception as e:
        print(f"DuckDuckGo Search Error: {e}")
        return []

def choose_best_result(ec, results):
    if not results:
        return None

    search_results = ""
    for i, result in enumerate(results):
        search_results += f"""
Result {i+1}
Title: {result.get("title", "")}
URL: {result.get("href", "")}
Snippet: {result.get("body", "")}
"""

    prompt = f"""
The user searched for: "{ec}"

Here are the search results:
{search_results}

Choose the ONE result that is the official webpage for this extracurricular.
Avoid: Login pages, Wikipedia, News articles, Blogs, Unrelated websites.
Return ONLY the URL. Do not include any other text.
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq Routing Error: {e}")
        return None

def get_page_text(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        for script_or_style in soup(["script", "style"]):
            script_or_style.extract()
            
        return soup.get_text(separator=" ", strip=True)
    except Exception as e:
        print(f"Scraping Error for {url}: {e}")
        return ""

def summarize(text):
    if not text:
        return "Not Found: Could not retrieve readable content from the website."

    prompt = f"""
You are helping students. Read this webpage text.
Extract:
- Description
- Cost
- Age requirements
- Time commitment
- Website

If a specific detail isn't listed, strictly say "Not Found."

Text:
{text[:12000]}
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Groq Summary Error: {e}")
        return "Not Found: Error generating summary."

@app.route("/search", methods=["POST"])
def search():
    data = request.get_json()
    if not data or "ec" not in data:
        return jsonify({"error": "Missing 'ec' field in request JSON."}), 400
        
    ec = data["ec"]

    query = f'{ec} extracurricular program official'
    results = search_web(query)

    if not results:
        return jsonify({"error": "Nothing found from the search engine."}), 404

    url = choose_best_result(ec, results)
    print("Chosen URL:", url)

    if not url or not url.startswith("http"):
        return jsonify({"error": "Failed to identify a valid official URL from search results."}), 404

    webpage_text = get_page_text(url)
    
    if len(webpage_text) < 150:
        print("Warning: Scraped text is very short. This site likely requires JavaScript rendering.")

    summary = summarize(webpage_text)

    return jsonify({
        "website": url,
        "summary": summary
    })

if __name__ == "__main__":
    app.run(debug=True)