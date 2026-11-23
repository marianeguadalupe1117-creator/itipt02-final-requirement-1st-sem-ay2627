# itipt02-final-requirement-1st-sem-ay2627
final requirement for itpt02, creating a Recipe Application using Ionic Framework

## Run locally

Start MySQL with the existing PrepMaster database. From the `backend` directory, create the Python environment, install the dependencies, and start the API.

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --port 8000
```

From the repository root, run `npm ci` and then `npm start -- --port 8102` and open [Register](http://localhost:8102/register).
