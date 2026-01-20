@echo off
SET PATH=%PATH%;C:\Users\Alexandre\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin
echo ========================================================
echo       EMAIL TIMELINE - DEPLOYMENT SCRIPT
echo ========================================================
echo.

echo 1. Authenticating with Google Cloud...
echo    (A browser window will open. Please log in.)
call gcloud auth login
if %errorlevel% neq 0 exit /b %errorlevel%

echo.
echo 2. Setting Project ID...
call gcloud config set project gen-lang-client-0674374976
if %errorlevel% neq 0 exit /b %errorlevel%

echo.
echo 3. Enabling Cloud Build API...
call gcloud services enable cloudbuild.googleapis.com
if %errorlevel% neq 0 exit /b %errorlevel%

echo.
echo 3.5. Granting Permissions...
call gcloud projects add-iam-policy-binding gen-lang-client-0674374976 --member="user:alefusco.email@gmail.com" --role="roles/cloudbuild.builds.editor"
call gcloud projects add-iam-policy-binding gen-lang-client-0674374976 --member="user:alefusco.email@gmail.com" --role="roles/serviceusage.serviceUsageAdmin"
call gcloud projects add-iam-policy-binding gen-lang-client-0674374976 --member="user:alefusco.email@gmail.com" --role="roles/storage.admin"

echo.
echo 4. Building and Pushing Image (Cloud Build)...
echo    (This sends your code to Google to build. No local Docker needed!)
call gcloud builds submit --tag gcr.io/gen-lang-client-0674374976/email-timeline .
if %errorlevel% neq 0 exit /b %errorlevel%

echo.
echo 6. Deploying to Cloud Run...
call gcloud projects add-iam-policy-binding gen-lang-client-0674374976 --member="user:alefusco.email@gmail.com" --role="roles/run.admin"
call gcloud run deploy email-timeline ^
  --image gcr.io/gen-lang-client-0674374976/email-timeline ^
  --platform managed ^
  --region us-central1 ^
  --allow-unauthenticated ^
  --add-cloudsql-instances gen-lang-client-0674374976:southamerica-east1:timeline ^
  --set-env-vars="DATABASE_URL=mysql://timeline:99099011Extra$@localhost/timeline?socket=/cloudsql/gen-lang-client-0674374976:southamerica-east1:timeline" ^
  --set-env-vars="JWT_SECRET=supersecretkey123" ^
  --set-env-vars="GEMINI_API_KEY=YOUR_GEMINI_KEY_HERE"

echo.
echo ========================================================
echo       DEPLOYMENT COMPLETE!
echo ========================================================
pause
