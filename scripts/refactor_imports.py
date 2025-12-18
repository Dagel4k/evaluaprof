import os

ROOT_DIR = 'faculty-pulse-app/src'

replacements = [
    # 1. Shared UI and Lib (Priority)
    ('@/components/ui', '@/shared/ui'),
    ('@/lib', '@/shared/lib'),
    
    # 2. Specific Mobile Folders
    ('@/pages', '@/mobile/pages'),
    ('@/context', '@/mobile/context'),
    ('@/hooks', '@/mobile/hooks'),

    # 3. Remaining components (Must be after ui)
    ('@/components', '@/mobile/components'),
]

# Replacements specific for App.tsx (relative paths)
app_replacements = [
    ('./pages', './mobile/pages'),
    ('./components', './mobile/components'),
    ('./context', './mobile/context'),
    ('./hooks', './mobile/hooks'),
    ('./lib', './shared/lib'),
]

for root, dirs, files in os.walk(ROOT_DIR):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
            filepath = os.path.join(root, file)
            
            with open(filepath, 'r') as f:
                content = f.read()
            
            new_content = content
            
            # Apply global replacements
            for old, new in replacements:
                new_content = new_content.replace(old, new)
            
            # Apply App.tsx specific replacements
            if file == 'App.tsx':
                for old, new in app_replacements:
                    new_content = new_content.replace(old, new)

            if new_content != content:
                print(f"Updating {filepath}")
                with open(filepath, 'w') as f:
                    f.write(new_content)
