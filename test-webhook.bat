@echo off
REM Webhook Testing Script for Data Daemons
REM Usage: test-webhook.bat [basic|image]

set ENDPOINT=http://localhost:8000/feed-by-email

if "%1"=="image" (
    echo Testing webhook with image attachment...
    curl -X POST %ENDPOINT% -H "Content-Type: application/json" --data-binary @test-webhook-with-image.json
) else (
    echo Testing basic webhook...
    curl -X POST %ENDPOINT% -H "Content-Type: application/json" --data-binary @test-webhook.json
)

echo.
echo.
echo ===============================================
echo Test complete!
echo.
echo To test with image attachment, run:
echo   test-webhook.bat image
echo ===============================================
