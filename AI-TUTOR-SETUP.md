# Chapter 04 — AI Go Tutor setup

The page works immediately in **LOCAL DEMO** mode. Demo mode uses the small bilingual Go knowledge base in `ai-tutor.js`, so no installation or API key is required.

To enable **LIVE AI**, keep the API key on the backend and start the two local servers below.

## 1. Open PowerShell in the website folder

```powershell
cd backend
```

## 2. Create and activate a Python environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

## 3. Install the backend packages

```powershell
python -m pip install -r requirements.txt
```

## 4. Configure the model provider

Copy `.env.example` to a new file named `.env`. Fill in the provider's current OpenAI-compatible base URL, model name, and your private API key.

```text
LLM_API_KEY=your_private_key
LLM_BASE_URL=https://your-provider.example/v1
LLM_MODEL=your-chat-model-name
```

Never place this key in `chapter4.html` or `ai-tutor.js`, and never upload `.env` to a public repository.

## 5. Start the secure backend

```powershell
uvicorn app:app --reload --port 8000
```

Keep that PowerShell window open.

## 6. Start the website in a second PowerShell window

Run this command from the website folder—the folder that contains `index.html`:

```powershell
python -m http.server 8771
```

Then open:

```text
http://127.0.0.1:8771/chapter4.html
```

The badge in the chat header shows the active mode:

- `LOCAL DEMO`: the browser or demo backend is producing controlled answers.
- `LIVE AI`: the backend has a key, base URL, and model, and requests are being sent through the protected server.

