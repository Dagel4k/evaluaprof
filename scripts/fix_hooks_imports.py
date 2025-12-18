import os

ROOT_DIR = 'faculty-pulse-app/src'

replacements = [
    ('@/mobile/hooks/use-mobile', '@/shared/hooks/use-mobile'),
    ('@/mobile/hooks/use-toast', '@/shared/hooks/use-toast'),
    # Fix potential relative imports in shared UI that might have been broken or updated incorrectly
    # If sidebar was in shared/ui, and imported ../hooks/use-mobile, it might need adjustment if I didn't catch it.
]

for root, dirs, files in os.walk(ROOT_DIR):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
            filepath = os.path.join(root, file)
            
            with open(filepath, 'r') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements:
                new_content = new_content.replace(old, new)
            
            if new_content != content:
                print(f"Fixing hooks in {filepath}")
                with open(filepath, 'w') as f:
                    f.write(new_content)
