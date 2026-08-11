def calculate_consumption_units(current: float, previous: float) -> float:
    """
    Units = Current - Previous
    """
    if current < previous:
        raise ValueError("Current reading cannot be lower than the previous reading.")
    return max(0.0, current - previous)

def calculate_litres(units: float) -> float:
    """
    Litres = Units * 10
    """
    return max(0.0, units * 10.0)

def calculate_water_cost(litres: float, rate_per_litre: float) -> float:
    """
    Water Cost = Litres * Billed Cost/L
    """
    return round(litres * rate_per_litre)
