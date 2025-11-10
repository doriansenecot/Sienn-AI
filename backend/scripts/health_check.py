#!/usr/bin/env python3
"""
System health check script for Sienn-AI.
Checks all components and provides a comprehensive status report.
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.utils.health_check import check_all_services
from app.core.logging_config import setup_logging, get_logger

setup_logging()
logger = get_logger(__name__)


def print_status(name: str, status: dict, indent: int = 0):
    """Pretty print service status."""
    indent_str = "  " * indent
    
    status_emoji = {
        "healthy": "✅",
        "degraded": "⚠️",
        "unhealthy": "❌",
    }
    
    emoji = status_emoji.get(status.get("status"), "❓")
    print(f"{indent_str}{emoji} {name}: {status.get('status', 'unknown').upper()}")
    
    # Print additional details
    for key, value in status.items():
        if key not in ["status", "responsive", "error"]:
            print(f"{indent_str}    {key}: {value}")
    
    if "error" in status:
        print(f"{indent_str}    Error: {status['error']}")


async def main():
    """Run comprehensive health check."""
    print("=" * 60)
    print("🏥 Sienn-AI System Health Check")
    print("=" * 60)
    print()
    
    logger.info("Starting system health check...")
    
    # Check all services
    result = await check_all_services()
    
    print(f"Overall Status: {result['status'].upper()}")
    print()
    print("Service Status:")
    print("-" * 60)
    
    for service_name, service_status in result['services'].items():
        print_status(service_name.replace("_", " ").title(), service_status)
        print()
    
    print("-" * 60)
    
    # Summary
    healthy = sum(1 for s in result['services'].values() if s['status'] == 'healthy')
    degraded = sum(1 for s in result['services'].values() if s['status'] == 'degraded')
    unhealthy = sum(1 for s in result['services'].values() if s['status'] == 'unhealthy')
    total = len(result['services'])
    
    print(f"\nSummary: {healthy}/{total} healthy, {degraded}/{total} degraded, {unhealthy}/{total} unhealthy")
    
    # Exit code based on overall status
    if result['status'] == 'healthy':
        print("\n✅ All systems operational!")
        return 0
    elif result['status'] == 'degraded':
        print("\n⚠️  System degraded but operational")
        return 1
    else:
        print("\n❌ System unhealthy - requires attention")
        return 2


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
