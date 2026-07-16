import os
import subprocess
import shutil
import sys

def main():
    print("=== Starting Bizionary ERP Standalone Build ===")
    
    # 1. Clean previous build folders
    folders_to_clean = ['build', 'dist', 'staticfiles']
    for folder in folders_to_clean:
        if os.path.exists(folder):
            print(f"Cleaning existing {folder} folder...")
            shutil.rmtree(folder)
            
    # 1.5. Compile React Frontend
    print("Compiling React frontend...")
    frontend_dir = os.path.join(os.getcwd(), 'bizionary-frontend')
    npm_cmd = 'npm.cmd' if os.name == 'nt' else 'npm'
    subprocess.run([npm_cmd, 'run', 'build'], cwd=frontend_dir, shell=True, check=True)
            
    # 2. Run Django collectstatic to gather all React + standard admin static files
    print("Collecting static files...")
    os.environ['DISABLE_MANIFEST'] = 'True'
    subprocess.run([sys.executable, 'manage.py', 'collectstatic', '--noinput'], check=True)
    
    # 3. Compile PyInstaller distribution directory
    print("Compiling PyInstaller executable...")
    add_db = "db.sqlite3;."
    add_static = "staticfiles;staticfiles"
    
    pyinstaller_bin = os.path.join(".venv", "Scripts", "pyinstaller")
    if not os.path.exists(pyinstaller_bin) and not os.path.exists(pyinstaller_bin + ".exe"):
        pyinstaller_bin = "pyinstaller"
        
    pyinstaller_cmd = [
        pyinstaller_bin,
        "--onedir",
        "--name=BizionaryERP",
        f"--add-data={add_db}",
        f"--add-data={add_static}",
        "--noconfirm",
        "run_server.py"
    ]
    
    print(f"Running command: {' '.join(pyinstaller_cmd)}")
    subprocess.run(pyinstaller_cmd, check=True)
    
    # 4. Copy click-to-run batch file into the compiled folder
    print("Adding click-to-run BizionaryERP.bat launcher...")
    dest_dir = os.path.join("dist", "BizionaryERP")
    shutil.copy("BizionaryERP.bat", dest_dir)
    
    # 5. Compress the output folder into a ZIP archive for distribution
    print("Compressing build directory into ZIP archive...")
    shutil.make_archive("BizionaryERP_Windows", 'zip', "dist", "BizionaryERP")
    
    print("\n=== Standalone packaging completed successfully! ===")
    print("Compiled folder: dist/BizionaryERP/")
    print("Distribution archive: BizionaryERP_Windows.zip")

if __name__ == '__main__':
    main()
