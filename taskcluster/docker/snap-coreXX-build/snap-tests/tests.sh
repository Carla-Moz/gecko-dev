#!/bin/bash

set -ex

pwd

ARTIFACT_DIR=$TASKCLUSTER_ROOT_DIR/builds/worker/artifacts/
mkdir -p "$ARTIFACT_DIR"

# There's a bug in snapd ~2.60.3-2.61 that will make "snap refresh" fail
# https://bugzilla.mozilla.org/show_bug.cgi?id=1873359
# https://bugs.launchpad.net/snapd/+bug/2048104/comments/13
# 
# So we retrieve the version and we will allow the first "snap refresh" to
# fail for versions < 2.61.1
SNAP_VERSION=$(snap info snapd --color=never --unicode=never |grep "installed:" | awk '{ print $2 }')
SNAP_MAJOR=$(echo "${SNAP_VERSION}" | cut -d'.' -f1)
SNAP_MINOR=$(echo "${SNAP_VERSION}" | cut -d'.' -f2)
SNAP_RELEASE=$(echo "${SNAP_VERSION}" | cut -d'.' -f3)

REFRESH_CAN_FAIL=true
if [ "${SNAP_MAJOR}" -ge 2 ]; then
  if [ "${SNAP_MAJOR}" -gt 2 ]; then
    REFRESH_CAN_FAIL=false
  else
    if [ "${SNAP_MINOR}" -ge 61 ]; then
      if [ "${SNAP_MINOR}" -gt 61 ]; then
        REFRESH_CAN_FAIL=false
      else
        if [ "${SNAP_RELEASE}" -gt 0 ]; then
          REFRESH_CAN_FAIL=false
        fi
      fi
    fi
  fi
fi

if [ "${REFRESH_CAN_FAIL}" = "true" ]; then
  sudo snap refresh || true
else
  sudo snap refresh
fi;

sudo snap refresh --hold=24h firefox

sudo snap install --name firefox --dangerous ./firefox.snap

RUNTIME_VERSION=$(snap run firefox --version | awk '{ print $3 }')

python3 -m pip install --user -r requirements.txt

sed -e "s/#RUNTIME_VERSION#/${RUNTIME_VERSION}/#" < expectations.json.in > expectations.json

python3 basic_tests.py expectations.json

cp ./*.png "$ARTIFACT_DIR/"
