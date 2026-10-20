# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# build BOTH binaries
RUN go build -o server ./cmd/server
RUN go build -o worker ./cmd/worker

# Runtime stage
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/server .
COPY --from=builder /app/worker .

ENV ENV=production
