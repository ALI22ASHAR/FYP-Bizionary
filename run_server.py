import os
import sys
import multiprocessing
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    # PyInstaller multiprocessing support
    multiprocessing.freeze_support()
    
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_system.settings')
    
    # Run automatic migrations on start
    print("Initializing ledger database...")
    try:
        execute_from_command_line([sys.argv[0], 'migrate', '--noinput'])
    except Exception as e:
        print(f"Migration check/info: {e}")
    
    # Start the server on port 8000
    print("Launching Bizionary ERP on http://127.0.0.1:8000")
    execute_from_command_line([sys.argv[0], 'runserver', '127.0.0.1:8000', '--noreload'])
