"""
Tests pour les fonctions utilitaires
"""
import pytest
from datetime import datetime, timedelta


def test_datetime_operations():
    """Test d'opérations sur les dates"""
    now = datetime.utcnow()
    assert isinstance(now, datetime)
    
    future = now + timedelta(days=1)
    assert future > now
    
    past = now - timedelta(hours=1)
    assert past < now


def test_string_formatting():
    """Test de formatage de strings"""
    name = "Sienn-AI"
    version = "1.0.0"
    
    formatted = f"{name} v{version}"
    assert formatted == "Sienn-AI v1.0.0"
    
    assert name.replace("-", "_") == "Sienn_AI"


def test_list_comprehension():
    """Test de list comprehension"""
    numbers = [1, 2, 3, 4, 5]
    squared = [n**2 for n in numbers]
    
    assert squared == [1, 4, 9, 16, 25]
    
    evens = [n for n in numbers if n % 2 == 0]
    assert evens == [2, 4]


def test_dict_comprehension():
    """Test de dict comprehension"""
    numbers = [1, 2, 3, 4, 5]
    squared_dict = {n: n**2 for n in numbers}
    
    assert squared_dict[3] == 9
    assert len(squared_dict) == 5


def test_set_operations():
    """Test d'opérations sur les sets"""
    set1 = {1, 2, 3, 4, 5}
    set2 = {4, 5, 6, 7, 8}
    
    union = set1 | set2
    assert len(union) == 8
    
    intersection = set1 & set2
    assert intersection == {4, 5}


def test_exception_handling():
    """Test de gestion d'exceptions"""
    with pytest.raises(ValueError):
        raise ValueError("Test error")
    
    with pytest.raises(ZeroDivisionError):
        1 / 0


def test_type_checking():
    """Test de vérification de types"""
    assert isinstance("test", str)
    assert isinstance(42, int)
    assert isinstance(3.14, float)
    assert isinstance([1, 2, 3], list)
    assert isinstance({"a": 1}, dict)


def test_none_handling():
    """Test de gestion de None"""
    value = None
    assert value is None
    assert value != False
    assert value != 0
    assert value != ""


def test_boolean_logic():
    """Test de logique booléenne"""
    assert True and True
    assert not (True and False)
    assert True or False
    assert not (False and False)


def test_numeric_operations():
    """Test d'opérations numériques"""
    assert abs(-5) == 5
    assert round(3.7) == 4
    assert max([1, 5, 3]) == 5
    assert min([1, 5, 3]) == 1
    assert sum([1, 2, 3, 4, 5]) == 15
