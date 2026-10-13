import os, glob
sources = glob.glob('backend/src/**/*.java', recursive=True)
with open('backend/sources.txt', 'w') as f:
    for src in sources:
        f.write('"{}"\n'.format(os.path.abspath(src).replace('\\', '/')))
print(os.system('javac -d backend/bin @backend/sources.txt'))
