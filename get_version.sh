#!/bin/bash
VERSION=$(git describe --tags --always)
sed -i "s/const SIMULATION_VERSION = .*/const SIMULATION_VERSION = \"$VERSION\";/" js/main.js