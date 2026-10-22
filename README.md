# Paper Football Club

A childhood tabletop paper football game recreated with Phaser 3, Matter.js physics, and Vite.

## Run

```bash
npm install
npm run dev
```

## Play

The paper footballer nearest to the ball is highlighted. Drag backwards from that player to aim and release to flick it. The player physically strikes the ball, and when all pieces settle, the closest player from either team takes the next turn. First to 3 goals wins. Local two-player gameplay on one device.

## Publish

In GitHub Settings → Pages, set Source to GitHub Actions. Then manually run the workflow in Actions. The site will be available at https://cikguadnan.github.io/paperfootball/ after a successful deployment.

## V1 scope

Five players per team, 2D physics, drag flick controls, goal scoring, nearest-player selection, and match reset. Club customization and online multiplayer are future features.
