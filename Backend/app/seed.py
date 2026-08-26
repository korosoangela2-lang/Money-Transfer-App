def build_seed_db():
    """A fresh, empty datastore — no demo users or sample data. Real
    accounts come from the normal /register flow, or `flask create-admin`
    for the first admin.
    """
    return {
        "version": 1,
        "users": [],
        "sessions": {},
        "passwordResets": {},
        "moneyRequests": [],
    }
