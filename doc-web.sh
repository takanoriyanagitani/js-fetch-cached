#!/bin/sh

port=50382
addr=127.0.0.1
tdir=./doc.d

miniserve \
  --port ${port} \
  --interfaces "${addr}" \
  "${tdir}"
