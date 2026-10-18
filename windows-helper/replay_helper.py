#!/usr/bin/env python3
"""CarryLab local Windows helper: download available Valve Dota 2 replay archives.
Python 3.10+ standard library only. .dem parsing NOT yet implemented.
"""
import argparse,bz2,json,re,shutil,sys,urllib.request,urllib.error
from pathlib import Path

def get_json(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"CarryLab/1.0"}),timeout=25) as r:return json.load(r)

def download(url,dest):
    req=urllib.request.Request(url,headers={"User-Agent":"CarryLab/1.0"})
    with urllib.request.urlopen(req,timeout=40) as r,open(dest,"wb") as f:
        amount=0
        while True:
            b=r.read(1024*1024)
            if not b:break
            amount+=len(b)
            if amount>800*1024*1024:raise ValueError("Archive is too large")
            f.write(b)

def main():
    p=argparse.ArgumentParser(description="CarryLab local replay downloader")
    p.add_argument("match_id")
    p.add_argument("--output",default="replays")
    p.add_argument("--unpack",action="store_true")
    a=p.parse_args()
    if not re.fullmatch(r"[0-9]{6,20}",a.match_id):p.error("Invalid match ID")
    dest=Path(a.output).resolve();dest.mkdir(parents=True,exist_ok=True)
    print("Господин, ищу запись матча",a.match_id)
    try:
        rows=get_json("https://api.opendota.com/api/replays?match_id="+a.match_id)
        row=next((r for r in rows if str(r.get("match_id"))==a.match_id and str(r.get("cluster","")).isdigit() and str(r.get("replay_salt","")).isdigit()),None)
        if not row:raise ValueError("OpenDota does not have replay metadata")
        archive=a.match_id+"_"+str(row["replay_salt"])+".dem.bz2"
        url="http://replay"+str(row["cluster"])+".valve.net/570/"+archive
        target=dest/archive
        download(url,target)
        if target.stat().st_size<1024:raise ValueError("Empty or invalid download")
        metadata={"match_id":a.match_id,"source":"OpenDota + Valve","archive_file":archive,"parser_status":"not_parsed","positions":[]}
        if a.unpack:
            dem=dest/(a.match_id+"_"+str(row["replay_salt"])+".dem")
            with bz2.BZ2File(target,"rb") as source,open(dem,"wb") as out:shutil.copyfileobj(source,out,1024*1024)
            metadata["dem_file"]=dem.name
        manifest=dest/(a.match_id+"-manifest.json")
        manifest.write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding="utf-8")
        print("Saved:",target,"Manifest:",manifest)
        print("Replay is not parsed. Map coordinates require a dedicated parser.")
        return 0
    except (OSError,ValueError,urllib.error.URLError,EOFError) as exc:
        print("Download failed:",exc,file=sys.stderr)
        return 1
if __name__=="__main__":sys.exit(main())
