# Reconciliacion de reglas

Fuente exclusiva: `CHARROPRO-FMCH-2026-SCORING-SPECIFICATION-001`.

## Piales legacy

Las reglas Product Base se preservan para lectura historica y se deshabilitan dentro de `FMCH_2026_LIBRE`. Una semejanza textual no se uso como equivalencia deportiva automatica.

| Rule ID | Legacy label | Legacy value | FMCH 2026 label/value | Action |
| --- | --- | ---: | --- | --- |
| `pb1` | Remolineado | 18 | Remolineado adelante / 18 | CORRECT |
| `pb2` | Madera | 20 | Sin equivalencia certificada | DISABLE_IN_PROFILE |
| `pb3` | Floreado | 24 | Floreado adelante / 28; atras / 30 | CORRECT |
| `pa1` | Dist. 10m-30m | 1 | Cada metro excedente / +1 por metro entero | CORRECT |
| `pa2` | Dist. 30-40m | 2 | Cada metro excedente / +1 por metro entero | DISABLE_IN_PROFILE |
| `pa3` | Dist. +40m | 3 | Cada metro excedente / +1 por metro entero | DISABLE_IN_PROFILE |
| `pa4` | Canilla | 1 | Caballo detenido dentro del rectangulo / +1 | CORRECT |
| `pa5` | Sobra Tiempo | 1 | Sin equivalencia confirmada | DISABLE_IN_PROFILE |
| `pa6` | Adic | 1 | Adicional manual preservado | PRESERVE |
| `pi1` | Perder vuelta | 1 | Catalogo FMCH 2026 explicito | DISABLE_IN_PROFILE |
| `pi2` | Chorrear antes | 2 | Catalogo FMCH 2026 explicito | DISABLE_IN_PROFILE |
| `pi3` | Pisar soga | 1 | Catalogo FMCH 2026 explicito | DISABLE_IN_PROFILE |
| `pi4` | Amarrar mal | 2 | Catalogo FMCH 2026 explicito | DISABLE_IN_PROFILE |
| `pi8` | Tiempo extra | 1 | Cada minuto excedente / -2 repetible | CORRECT |
| `pd1` | Reventar soga | DQ | Rotura de reata, hondilla o nudo | CORRECT |
| `pd2` | Soltar caballo | DQ | Catalogo FMCH 2026 explicito | DISABLE_IN_PROFILE |
| `pd4` | Fuera de tiempo | DQ | Catalogo FMCH 2026 explicito | DISABLE_IN_PROFILE |

## Catalogo Piales 2026

- Bases: Lazo de verijas 14; Remolineado adelante 18; Remolineado atras 20; Piquete adelante 22; Piquete atras 24; Rompe chaqueta por lado del lienzo 26; Floreado adelante 28; Floreado atras 30.
- Adicionales: distancia numerica, caballo detenido dentro del rectangulo, relleno de madera y conservar vueltas en la mano.
- Infracciones: 13 individuales y 1 de equipo.
- Descalificaciones: 17. `Yegua quita la reata` conserva la infraccion confirmada y su Descalificacion asociada.

## Coleadero legacy

| Grupo legacy | IDs | Tratamiento FMCH 2026 |
| --- | --- | --- |
| Base | `cob1..cob4` | PRESERVE historico y DISABLE_IN_PROFILE; se reemplaza por nueve caidas identificadas |
| Adicionales | `coa1..coa4` | PRESERVE historico y DISABLE_IN_PROFILE; distancia se reconcilia por bandas exclusivas, Lola y Sin apretador |
| Infracciones | `coi1..coi6`, `coi8` | PRESERVE historico y DISABLE_IN_PROFILE; se usa catalogo confirmado de 23 reglas |
| DQ | `cod1..cod4` | PRESERVE historico y DISABLE_IN_PROFILE; se usa catalogo confirmado de 15 causas |

## Catalogo Coleadero 2026

- Caidas: Redonda derecha 12; Media derecha 10; Sobre lomo derecha 10; Sobre lomo izquierda 6; Redonda contraria 8; Media contraria 6; Panzazo 6; Senton 6; Molinete 6.
- Adicionales: antes de 30 m +3; 30 a 40 m +2; 40 a 50 m +1; Lola +2; Sin apretador +1.
- Infracciones: 23 individuales y 2 de equipo.
- Descalificaciones: 15.
- Cuarta fila: no se convierte en cuarto coleador; permanece bloqueada hasta confirmacion de fuente.
