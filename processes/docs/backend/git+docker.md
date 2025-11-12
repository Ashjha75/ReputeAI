Here’s a **clean, minimal Git + Docker command list** — practical for daily project use and interviews.
No noise. Just the essential 0→intermediate commands you’ll actually use.

---

## 🔹 GIT — Essential Developer Workflow

### 1. Setup (once per machine)

```bash
git config --global user.name "Ashish Jha"
git config --global user.email "ashish@example.com"
git config --global core.editor "code --wait"
```

Check:

```bash
git config --list
```

---

### 2. Repository basics

```bash
git init                     # start a new local repo
git clone <repo_url>         # clone existing repo
git status                   # show changes (untracked, modified, staged)
git add <file>               # stage file for commit
git add .                    # stage all changed files
git commit -m "meaningful message"   # commit changes
git log --oneline --graph --decorate  # short commit history
```

---

### 3. Branching (core)

```bash
git branch                   # list branches
git branch <name>            # create branch
git checkout <name>          # switch branch
git switch <name>            # modern equivalent
git checkout -b <name>       # create + switch
git merge <branch>           # merge into current branch
git branch -d <name>         # delete local branch
```

---

### 4. Remote operations

```bash
git remote -v                # list remotes
git push origin <branch>     # push branch to remote
git pull origin <branch>     # fetch + merge latest
git fetch origin             # fetch without merge
git push -u origin <branch>  # first push (link local → remote)
```

---

### 5. Fix mistakes safely

```bash
git diff                     # see unstaged changes
git restore <file>           # discard unstaged changes
git reset <file>             # unstage file
git reset --hard HEAD        # reset to last commit (⚠ wipes local changes)
git revert <commit_hash>     # create new commit that undoes old one
git stash                    # save work temporarily
git stash apply              # reapply stashed changes
```

---

### 6. Pull Request (PR) routine

```bash
git checkout -b feature/new-endpoint
# edit code
git add .
git commit -m "add new endpoint for posts"
git push origin feature/new-endpoint
# then open PR on GitHub
```

---

### 7. Keeping branch clean

```bash
git fetch origin
git rebase origin/main       # apply your commits on top of latest main
git push -f origin feature/...  # force push after rebase (safe if you own branch)
```

---

### 8. Tags (release basics)

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

### 9. Clone & build existing project

```bash
git clone https://github.com/org/reputeai.git
cd reputeai
git checkout develop
```

---

## 🔹 DOCKER — Essentials for Dev & Interview

### 1. Verify installation

```bash
docker version
docker info
```

---

### 2. Pull and run containers

```bash
docker pull mysql:8.0                     # download image
docker run -d --name my-mysql -e MYSQL_ROOT_PASSWORD=pass -p 3306:3306 mysql:8.0
docker ps                                # list running containers
docker ps -a                             # list all containers
docker stop my-mysql                     # stop container
docker start my-mysql                    # start again
```

---

### 3. Build + run your own app

Assuming you have a `Dockerfile`:

```bash
docker build -t reputeapi:latest .       # build image from Dockerfile
docker images                            # list images
docker run -d -p 8080:8080 reputeapi     # run container exposing port 8080
```

---

### 4. Inspect and debug

```bash
docker logs <container_id>               # view container logs
docker exec -it <container_id> bash      # open shell inside container
docker inspect <container_id>            # view detailed config
docker stats                             # live resource usage
```

---

### 5. Stop / clean up

```bash
docker stop <id>
docker rm <id>                           # remove container
docker rmi <image_id>                    # remove image
docker system prune -f                   # clean unused images/containers
```

---

### 6. Docker Compose (multi-container local dev)

```bash
docker-compose up -d                     # start all services in background
docker-compose ps                        # list running services
docker-compose logs -f                   # follow logs
docker-compose down                      # stop & remove all
```

Typical `docker-compose.yml`:

```yaml
version: "3"
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: pass
    ports: ["3306:3306"]

  backend:
    build: .
    ports: ["8080:8080"]
    depends_on: [db]
```

---

### 7. Common interview concepts

* **Image vs Container:** Image = blueprint; Container = running instance.
* **Layer caching:** Docker builds reuse unchanged layers for speed.
* **Expose vs Publish:** `EXPOSE` in Dockerfile documents ports; `-p` actually maps them.
* **Volumes:** For persistent data:

  ```bash
  docker run -v mydata:/var/lib/mysql mysql
  docker volume ls
  ```
* **EntryPoint vs CMD:** EntryPoint = main command; CMD = default args.

---

### 8. Practical combo for this project

```bash
# Build + run Spring Boot API
docker build -t reputeapi .
docker run -d -p 8080:8080 reputeapi

# MySQL + Redis for dev
docker-compose up -d
```

---

### 9. Minimal cleanup before commit

```bash
docker stop $(docker ps -q)
docker system prune -af
```

---

✅ **Summary to remember (interview-ready)**

| Task           | Git Command                        | Docker Command                   |
| -------------- | ---------------------------------- | -------------------------------- |
| Create branch  | `git checkout -b feature/x`        | –                                |
| Stage & commit | `git add . && git commit -m "msg"` | –                                |
| Merge updates  | `git pull origin main`             | –                                |
| Build image    | –                                  | `docker build -t app:latest .`   |
| Run container  | –                                  | `docker run -d -p 8080:8080 app` |
| View logs      | –                                  | `docker logs <id>`               |
| Clean up       | –                                  | `docker system prune -f`         |

---


