import os
import sys
import multiprocessing

# 1. Set environment variable first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_system.settings')

# 2. Initialize Django settings and apps
import django
django.setup()

# 3. Explicitly import all URLs to ensure PyInstaller bundles them
import erp_system.urls
import dashboard.urls
import screen_2_sales_items.urls
import accounts.urls
import user_management.urls
import chatbot.urls
import insights.urls
import invoices.urls
import products.urls
import purchases.urls
import sales.urls

# 4. Explicitly import middleware and settings dependencies for PyInstaller
import whitenoise.middleware
import whitenoise.storage
import corsheaders.middleware
import dj_database_url

if __name__ == '__main__':
    # PyInstaller multiprocessing support
    multiprocessing.freeze_support()
    
    # Run automatic migrations on start
    print("Initializing ledger database...")
    try:
        from django.core.management import execute_from_command_line
        execute_from_command_line([sys.argv[0], 'migrate', '--noinput'])
    except Exception as e:
        print(f"Migration check/info: {e}")
    
    # Start the server on port 8000
    print("Launching Bizionary ERP on http://127.0.0.1:8000")
    from django.core.management import execute_from_command_line
    execute_from_command_line([sys.argv[0], 'runserver', '127.0.0.1:8000', '--noreload'])
