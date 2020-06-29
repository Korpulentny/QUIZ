npm run createdb
npm run build

node node ./bin/www &
APP_PID=$!

npx mocha -t 20000 -r ts-node/register tests/test.ts

kill ${APP_PID}
