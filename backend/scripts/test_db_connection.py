"""Database Connectivity & CRUD Verification Script for Nagrik AI."""

import asyncio
import os
import sys

# Ensure parent directory is on python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.src.database.adapter import db_adapter
from backend.src.config import settings

async def main():
    print("=" * 60)
    print("[START] Testing Nagrik AI Database Adapter...")
    print(f"   Supabase Configured: {settings.is_supabase_configured}")
    print(f"   Supabase URL: {settings.SUPABASE_URL}")
    print("=" * 60)

    await db_adapter.initialize()
    is_ok = await db_adapter.is_healthy()
    print(f"[Health Check] Adapter is_healthy: {is_ok}")

    # 1. Test Wards Query
    wards = await db_adapter.list_wards()
    print(f"[Read Test] Retrieved {len(wards)} municipal wards.")
    assert len(wards) > 0, "Expected at least 1 ward"

    # 2. Test Conversation Creation
    conv_id = await db_adapter.create_conversation(ward_id=4, language_code="hi-IN", title="Test Inquiry")
    print(f"[Create Test] Created conversation: {conv_id}")

    # 3. Test Message Save & Retrieval
    msg_id = await db_adapter.save_message(
        conversation_id=conv_id,
        role="user",
        content="What is the property tax rebate?",
        citations=[]
    )
    print(f"[Create Test] Saved message: {msg_id}")

    history = await db_adapter.get_conversation_history(conv_id, limit=5)
    print(f"[Read Test] Conversation history count: {len(history)}")
    assert len(history) >= 1, "Expected at least 1 message in history"

    print("=" * 60)
    print("[SUCCESS] All Database Adapter tests passed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
