# E1-1 개발 워크스테이션 구축

> 진행 중인 과제 기록입니다. 확인되지 않은 실습은 완료로 표시하지 않았습니다. 실제 명령과 출력, 캡처 링크를 추가하면서 갱신하세요.

## 미션 개요

터미널과 파일 권한을 다루고 Docker로 웹 서버를 컨테이너화합니다. 포트 매핑, 바인드 마운트 변경 반영, 볼륨 데이터 영속성을 검증하고 수행 결과를 문서화해 GitHub에 제출합니다.

## 실행 환경

| 항목 | 확인값 |
|---|---|
| 작업 폴더 | `C:\Users\ADMIN\E1-1` |
| OS | Windows (세부 버전 기록 필요) |
| 쉘 | PowerShell 7.6.9 |
| Docker CLI | Docker version 29.9.2, build a82e528 |
| Docker 데몬 | `docker info` 확인 완료(사용자 확인); 출력 기록 필요 |
| Git | git version 2.56.0.windows.1 |
| GitHub | `https://github.com/smz7093-web/E1-1` |

```powershell
$PSVersionTable.PSVersion
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsBuildNumber
docker --version
docker info
git --version
```

`docker info` 출력에 민감한 정보가 있으면 공유 전에 가립니다.

## 수행 체크리스트

- [x] Linux 터미널에서 위치 이동, 파일/디렉터리 생성 및 목록 확인 (캡처 포함)
- [ ] 터미널 복사·이름 변경·삭제 실습 기록
- [ ] 파일 및 디렉터리 권한 변경 전후 기록 (파일 권한 캡처만 있음)
- [x] `hello-world`, Ubuntu 컨테이너 실행/재진입 실습 캡처
- [ ] Docker 버전/데몬, 이미지 목록, 로그·리소스 점검 결과 기록
- [ ] 컨테이너 목록·로그·리소스 확인
- [ ] 직접 작성한 Dockerfile 빌드 및 실행
- [ ] 포트 매핑 접속 증거(주소창/응답 또는 curl)
- [ ] 바인드 마운트 호스트 변경 반영
- [ ] 컨테이너 삭제 전후 Docker 볼륨 데이터 확인
- [ ] Git 설정 및 GitHub/VS Code 연동 증거
- [ ] 트러블슈팅 2건 이상

## 실습 캡처

아래 캡처는 `captures/` 폴더에 원본을 보관했습니다.

| 캡처 | 확인되는 내용 |
|---|---|
| [mydir_list.jpg](captures/mydir_list.jpg) | Ubuntu 컨테이너 `/temp`에서 `touch`, `mkdir`, `ls -l`로 파일과 디렉터리 생성/목록 확인 |
| [chmod.jpg](captures/chmod.jpg) | `file.txt`에 `chmod 600`, `chmod 700`을 적용하고 `ls -l`로 권한 확인. `cdmod` 오타 오류도 기록되어 있음 |
| [docker_run.jpg](captures/docker_run.jpg) | PowerShell에서 `docker run hello-world` 성공 출력 |
| [exit_exec.jpg](captures/exit_exec.jpg) | 종료된 Ubuntu 컨테이너 시작 후 `docker exec` 재진입, 파일/디렉터리 확인, `exit` 뒤 컨테이너가 실행 중임을 `docker ps`로 확인 |
| [linux_os_release.jpg](captures/linux_os_release.jpg) | 컨테이너 안에서 `/etc/os-release` 확인; 출력은 Ubuntu 26.04.1 LTS |

현재 캡처만으로는 파일 권한 실습은 확인되지만 디렉터리 권한 변경은 확인되지 않습니다. 복사/이름 변경/삭제, Dockerfile 웹 서버, 포트 접속, 마운트/볼륨, GitHub 연동은 추가 증거가 필요합니다.

## 터미널 조작 기록

아래 예시를 실제 수행한 명령과 출력으로 대체합니다.

```powershell
Get-Location
Get-ChildItem -Force
Set-Location <작업할_경로>
New-Item -ItemType Directory -Name practice
New-Item -ItemType File -Path .\practice\note.txt
Set-Content .\practice\note.txt '실습 내용'
Get-Content .\practice\note.txt
Copy-Item .\practice\note.txt .\practice\copy.txt
Move-Item .\practice\copy.txt .\practice\renamed.txt
Remove-Item .\practice\renamed.txt
```

| 목적 | 명령 및 실제 출력 |
|---|---|
| 위치/목록 | 기록 필요 |
| 파일·폴더 조작 | 기록 필요 |
| 파일 내용/빈 파일 | 기록 필요 |

관련 캡처: [mydir_list.jpg](captures/mydir_list.jpg)

## 권한 실습

Windows ACL과 Linux `chmod`는 표현 방식이 다릅니다. Windows에서 ACL을 조회·변경하거나, WSL/Linux를 사용했다면 `ls -l`, `chmod`, `stat` 결과를 기록합니다.

```powershell
Get-Acl .\<파일경로> | Format-List
Get-Acl .\<폴더경로> | Format-List
# 실제 변경 명령과 변경 후 조회 기록
```

| 대상 | 변경 전 | 수행한 변경 | 변경 후 |
|---|---|---|---|
| 파일 | 기록 필요 | 기록 필요 | 기록 필요 |
| 디렉터리 | 기록 필요 | 기록 필요 | 기록 필요 |

파일 권한 캡처: [chmod.jpg](captures/chmod.jpg). 이 이미지는 파일 `file.txt`의 권한만 보여주며 디렉터리 권한 변경 증거는 아닙니다.

## Docker 점검 및 기본 운영

`docker --version`과 `docker info`는 사용자가 확인 완료했습니다. 제출 시 실제 핵심 출력도 기록합니다.

```text
> docker --version
Docker version 29.9.2, build a82e528

> docker info
[Server Version, 컨테이너/이미지 수 등 실제 확인 결과 기록]
```

`hello-world` 실행 증거: [docker_run.jpg](captures/docker_run.jpg)

```powershell
docker images
docker ps
docker ps -a
docker logs <컨테이너명>
docker stats --no-stream
docker run --rm hello-world
```

### Ubuntu 컨테이너

```powershell
docker run -it --name e1-ubuntu ubuntu bash
# 컨테이너 안에서
pwd
ls -la
echo "hello from ubuntu"
exit
```

`docker run -it`는 컨테이너를 새로 만들고 대화형으로 진입하며, `docker exec -it`는 실행 중인 컨테이너에 추가 프로세스로 진입합니다. 종료 후 상태와 재진입을 관찰해 기록합니다.

```powershell
docker ps -a
docker start e1-ubuntu
docker exec -it e1-ubuntu bash
```

결과/관찰: 기록 필요

관련 캡처: [exit_exec.jpg](captures/exit_exec.jpg), [linux_os_release.jpg](captures/linux_os_release.jpg)

## Dockerfile 웹 서버

- 베이스 이미지 및 선택 이유: 기록 필요(예: `nginx:alpine`)
- 커스텀 내용과 목적: 기록 필요
- 웹 소스 위치: 기록 필요

```text
E1-1/
├── README.md
├── Dockerfile
└── site/index.html
```

실제 Dockerfile과 소스는 저장소에 포함하고 이 문서에서 링크합니다.

```dockerfile
# 실제 Dockerfile 내용 또는 파일 링크
```

```powershell
docker build -t e1-web:1.0 .
docker run -d --name e1-web -p 8080:80 e1-web:1.0
docker ps
curl.exe http://localhost:8080
docker logs e1-web
```

- 접속 주소: `http://localhost:8080` (실제 포트로 수정)
- 응답: 기록 필요
- 브라우저 주소창과 응답 화면 캡처: `docs/images/`에 저장 후 링크

## 바인드 마운트 반영

호스트 파일을 연결하고 수정 전후 응답을 비교합니다. 경로는 실제 구성에 맞게 바꿉니다.

```powershell
docker run -d --name e1-bind -p 8081:80 -v "${PWD}\site:/usr/share/nginx/html:ro" nginx:alpine
curl.exe http://localhost:8081
# site/index.html을 수정한 뒤 다시 요청
curl.exe http://localhost:8081
```

- 변경 전 결과: 기록 필요
- 호스트 변경 내용: 기록 필요
- 변경 후 결과: 기록 필요

## Docker 볼륨 영속성

```powershell
docker volume create e1-data
docker run -d --name e1-vol -v e1-data:/data ubuntu sleep infinity
docker exec e1-vol bash -lc "echo persistent-data > /data/check.txt && cat /data/check.txt"
docker rm -f e1-vol
docker run -d --name e1-vol-check -v e1-data:/data ubuntu sleep infinity
docker exec e1-vol-check cat /data/check.txt
docker volume inspect e1-data
docker rm -f e1-vol-check
```

- 삭제 전 데이터: 기록 필요
- 삭제 후 새 컨테이너에서 읽은 값: 기록 필요
- 볼륨 검사 결과: 기록 필요

## Git 및 GitHub

```powershell
git config --global user.name "<표시 이름>"
git config --global user.email "<GitHub 등록 이메일>"
git config --global init.defaultBranch main
git config --list
git init
git add README.md
git commit -m "docs: add E1-1 mission README"
git branch -M main
git remote add origin https://github.com/smz7093-web/E1-1.git
git push -u origin main
```

- 저장소: [smz7093-web/E1-1](https://github.com/smz7093-web/E1-1)
- VS Code GitHub 로그인/저장소 연동 캡처: 완료 후 링크 추가
- 민감정보 점검: 완료 여부 기록(토큰·비밀번호는 문서화하지 않음)

## 트러블슈팅

### 사례 1

- 문제: 기록 필요
- 원인 가설: 기록 필요
- 확인 명령 및 결과: 기록 필요
- 해결/대안: 기록 필요

### 사례 2

- 문제: 기록 필요
- 원인 가설: 기록 필요
- 확인 명령 및 결과: 기록 필요
- 해결/대안: 기록 필요

## 핵심 개념

- **절대/상대 경로:** 절대 경로는 전체 위치(`C:\Users\ADMIN\E1-1\README.md`), 상대 경로는 현재 위치 기준(`.\README.md`)입니다.
- **권한:** Linux의 `r/w/x`는 읽기/쓰기/실행입니다. `755`는 소유자 `rwx`, 나머지 `r-x`; `644`는 소유자 `rw-`, 나머지 `r--`입니다. Windows ACL은 별도 모델입니다.
- **이미지/컨테이너:** 이미지는 실행에 필요한 파일과 설정의 묶음이고 컨테이너는 이미지에서 실행되는 격리 인스턴스입니다.
- **포트 매핑:** `-p 호스트포트:컨테이너포트`로 호스트 요청을 컨테이너 서비스로 전달합니다.
- **바인드 마운트/볼륨:** 바인드 마운트는 호스트 경로를 연결합니다. 볼륨은 Docker가 관리하며 컨테이너와 데이터의 생명주기를 분리합니다.
- **Git/GitHub:** Git은 로컬 변경 이력 관리 도구이고 GitHub는 원격 저장소 및 협업 플랫폼입니다.

## 제출 전 확인

- [ ] 실제 수행 명령과 출력으로 문서 갱신
- [ ] Dockerfile 및 웹 소스 포함
- [ ] 포트 접속, 마운트 반영, 볼륨 영속성 증거 링크
- [ ] 트러블슈팅 2건 이상
- [ ] 캡처에 명령과 출력 포함, 민감정보 제거/마스킹
- [ ] README에서 증거 파일 접근 가능
- [ ] GitHub 저장소 링크와 제출 권한 확인
