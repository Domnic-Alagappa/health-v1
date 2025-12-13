#!/bin/bash

# SonarQube Setup Script
# Sets up SonarQube with default credentials and generates an auth token

set -e

SONAR_URL="${SONAR_HOST_URL:-http://localhost:9000}"
SONAR_ADMIN_USER="${SONAR_ADMIN_USER:-admin}"
SONAR_ADMIN_PASSWORD="${SONAR_ADMIN_PASSWORD:-admin}"
NEW_ADMIN_PASSWORD="${NEW_SONAR_PASSWORD:-Admin@123!}"
TOKEN_NAME="${SONAR_TOKEN_NAME:-health-v1-scanner}"

echo "=== SonarQube Setup Script ==="
echo ""
echo "Configuration:"
echo "  - SonarQube URL: $SONAR_URL"
echo "  - Admin User: $SONAR_ADMIN_USER"
echo "  - Token Name: $TOKEN_NAME"
echo ""

# Wait for SonarQube to be ready
echo "Waiting for SonarQube to be ready..."
max_attempts=60
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s "$SONAR_URL/api/system/status" | grep -q '"status":"UP"'; then
        echo "✓ SonarQube is ready!"
        break
    fi
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        echo "✗ Timeout waiting for SonarQube to start"
        exit 1
    fi
    echo "  Waiting... ($attempt/$max_attempts)"
    sleep 5
done

# Check if password needs to be changed (first login)
echo ""
echo "Checking if initial password change is required..."

# Try with default password first
auth_response=$(curl -s -o /dev/null -w "%{http_code}" -u "$SONAR_ADMIN_USER:$SONAR_ADMIN_PASSWORD" "$SONAR_URL/api/authentication/validate")

if [ "$auth_response" = "200" ]; then
    echo "✓ Default credentials still valid"
    
    # Change the password
    echo "Changing admin password..."
    change_result=$(curl -s -u "$SONAR_ADMIN_USER:$SONAR_ADMIN_PASSWORD" \
        -X POST "$SONAR_URL/api/users/change_password" \
        -d "login=$SONAR_ADMIN_USER" \
        -d "previousPassword=$SONAR_ADMIN_PASSWORD" \
        -d "password=$NEW_ADMIN_PASSWORD")
    
    if [ -z "$change_result" ] || echo "$change_result" | grep -q "errors"; then
        echo "⚠ Password change may have failed: $change_result"
        echo "  Trying to continue with new password anyway..."
    else
        echo "✓ Password changed successfully"
    fi
    
    SONAR_ADMIN_PASSWORD="$NEW_ADMIN_PASSWORD"
else
    echo "Default password not valid. Trying with new password..."
    auth_check=$(curl -s -o /dev/null -w "%{http_code}" -u "$SONAR_ADMIN_USER:$NEW_ADMIN_PASSWORD" "$SONAR_URL/api/authentication/validate")
    if [ "$auth_check" = "200" ]; then
        echo "✓ New password already set"
        SONAR_ADMIN_PASSWORD="$NEW_ADMIN_PASSWORD"
    else
        echo "✗ Cannot authenticate. Please check credentials."
        exit 1
    fi
fi

# Check if token already exists
echo ""
echo "Checking for existing tokens..."
existing_tokens=$(curl -s -u "$SONAR_ADMIN_USER:$SONAR_ADMIN_PASSWORD" \
    "$SONAR_URL/api/user_tokens/search")

if echo "$existing_tokens" | grep -q "\"name\":\"$TOKEN_NAME\""; then
    echo "Token '$TOKEN_NAME' already exists. Revoking and recreating..."
    curl -s -u "$SONAR_ADMIN_USER:$SONAR_ADMIN_PASSWORD" \
        -X POST "$SONAR_URL/api/user_tokens/revoke" \
        -d "name=$TOKEN_NAME" > /dev/null
    echo "✓ Old token revoked"
fi

# Generate new token
echo ""
echo "Generating new authentication token..."
token_response=$(curl -s -u "$SONAR_ADMIN_USER:$SONAR_ADMIN_PASSWORD" \
    -X POST "$SONAR_URL/api/user_tokens/generate" \
    -d "name=$TOKEN_NAME")

# Extract token from response
SONAR_TOKEN=$(echo "$token_response" | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')

if [ -z "$SONAR_TOKEN" ]; then
    echo "✗ Failed to generate token"
    echo "Response: $token_response"
    exit 1
fi

echo "✓ Token generated successfully!"

# Save credentials to file
CREDENTIALS_FILE="./sonar-credentials.txt"
cat > "$CREDENTIALS_FILE" << EOF
=== SonarQube Credentials ===
Generated: $(date -Iseconds)

URL: $SONAR_URL
Admin User: $SONAR_ADMIN_USER
Admin Password: $NEW_ADMIN_PASSWORD

Token Name: $TOKEN_NAME
Token: $SONAR_TOKEN

Add to .env file:
SONAR_HOST_URL=$SONAR_URL
SONAR_TOKEN=$SONAR_TOKEN
SONAR_ADMIN_PASSWORD=$NEW_ADMIN_PASSWORD

IMPORTANT: Keep this file secure!
EOF

# Set file permissions (Unix only)
chmod 600 "$CREDENTIALS_FILE" 2>/dev/null || true

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Credentials saved to: $CREDENTIALS_FILE"
echo ""
echo "Add these to your .env file:"
echo "  SONAR_HOST_URL=$SONAR_URL"
echo "  SONAR_TOKEN=$SONAR_TOKEN"
echo ""
echo "Access SonarQube at: $SONAR_URL"
echo "  Username: $SONAR_ADMIN_USER"
echo "  Password: $NEW_ADMIN_PASSWORD"
echo ""

