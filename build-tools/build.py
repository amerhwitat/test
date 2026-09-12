#!/usr/bin/env python3
from pathlib import Path
import argparse,platform,shutil,subprocess,sys,time
R=Path(__file__).resolve().parents[1]
def X(c,d=False):
 print(f'[{time.strftime("%H:%M:%S")}] [COMMAND] {" ".join(map(str,c))}',flush=True)
 if d:return 0
 p=subprocess.Popen(list(map(str,c)),cwd=R,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
 for x in p.stdout:print(x.rstrip(),flush=True)
 return p.wait()
def main():
 a=argparse.ArgumentParser();a.add_argument('--dry-run',action='store_true');a.add_argument('--only',choices=['all','python','java','node','native','sql'],default='all');a.add_argument('--onefile',action='store_true');a.add_argument('--python');a=a.parse_args();print(f'[BUILD] {R.name} {platform.system()} {platform.machine()}',flush=True)
 if a.only in ('all','python') and (a.python or list(R.rglob('*.py'))) and shutil.which('python'):
  p=R/a.python if a.python else next((p for p in R.rglob('*.py') if p.name not in {'__init__.py','setup.py'} and '.git' not in p.parts and 'build' not in p.parts),None)
  if p and X([sys.executable,'-m','PyInstaller','--noconfirm','--clean']+(['--onefile'] if a.onefile else [])+[str(p)],a.dry_run):return 1
 if a.only in ('all','java') and (list(R.rglob('*.java')) or (R/'pom.xml').exists()):
  q=['mvn','-B','test','package'] if (R/'pom.xml').exists() and shutil.which('mvn') else ['javac',*[str(p) for p in R.rglob('*.java')]] if shutil.which('javac') else []
  if q and X(q,a.dry_run):return 1
 if a.only in ('all','node') and (R/'package.json').exists() and shutil.which('npm'):
  if X(['npm','ci'] if (R/'package-lock.json').exists() else ['npm','install'],a.dry_run) or X(['npm','run','build'],a.dry_run):return 1
 if a.only in ('all','native') and (R/'CMakeLists.txt').exists() and shutil.which('cmake'):
  b=R/'build'/'cmake';b.mkdir(parents=True,exist_ok=True)
  if X(['cmake','-S',R,'-B',b,'-DCMAKE_BUILD_TYPE=Release'],a.dry_run) or X(['cmake','--build',b,'--config','Release','--parallel'],a.dry_run):return 1
 if a.only in ('all','sql'):print(f'[DATABASE] {len(list(R.rglob("*.sql")))} SQL scripts discovered',flush=True)
 print('[BUILD] DONE',flush=True);return 0
if __name__=='__main__':raise SystemExit(main())
