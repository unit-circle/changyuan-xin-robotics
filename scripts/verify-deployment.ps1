param(
    [string]$BaseUrl = "https://changyuanxin.dpdns.org"
)

$ErrorActionPreference = "Stop"
$base = $BaseUrl.TrimEnd("/")
$checks = @(
    @{ Path = "/"; Expected = "Creative Robotics Researcher" },
    @{ Path = "/research"; Expected = "Research portfolio" },
    @{ Path = "/coursework"; Expected = "Coursework as" },
    @{ Path = "/publications"; Expected = "Research outputs" },
    @{ Path = "/cv"; Expected = "Interactive CV" },
    @{ Path = "/resources"; Expected = "Materials designed to be" },
    @{ Path = "/private"; Expected = "Authorization code" },
    @{ Path = "/sitemap.xml"; Expected = "multi-robot-aero-engine-assembly" }
)

Write-Host ""
Write-Host "Checking public deployment at $base" -ForegroundColor Cyan

$failed = $false
foreach ($check in $checks) {
    $url = "$base$($check.Path)"
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
        $matches = $response.StatusCode -eq 200 -and
            $response.Content -match [regex]::Escape($check.Expected)

        if ($matches) {
            Write-Host "[PASS] $url" -ForegroundColor Green
        }
        else {
            Write-Host "[FAIL] $url returned an unexpected page" -ForegroundColor Red
            $failed = $true
        }
    }
    catch {
        Write-Host "[FAIL] $url - $($_.Exception.Message)" -ForegroundColor Red
        $failed = $true
    }
}

Write-Host ""
Write-Host "Admin check: open $base/admin in an InPrivate window." -ForegroundColor Yellow
Write-Host "It should show Cloudflare Access before the administration workspace."

if ($failed) {
    Write-Host ""
    Write-Host "One or more public checks failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "All public deployment checks passed." -ForegroundColor Green
