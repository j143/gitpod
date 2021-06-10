// Copyright (c) 2021 Gitpod GmbH. All rights reserved.
// Licensed under the GNU Affero General Public License (AGPL).
// See License-AGPL.txt in the project root for license information.

package num

import (
	"fmt"
	"testing"
)

func TestParseUint32(t *testing.T) {
	tests := []struct {
		Input    string
		Expected uint32
		Error    string
	}{
		{"", 0, "empty input"},
		{" ", 0, "empty input"},
		{"0", 0, ""},
		{"-1", 0, "input value out of range (uint32)"},
		{"-100", 0, "input value out of range (uint32)"},
		{"100000000000", 0, "input value out of range (uint32)"},
		{"1123", 1123, ""},
		{"31000", 31000, ""},
		{"not a number", 0, "invalid input value"},
	}

	for _, test := range tests {
		t.Run(fmt.Sprintf("parsing %v", test.Input), func(t *testing.T) {
			val, err := ParseUint32(test.Input)
			if test.Error != "" {
				if err == nil {
					t.Error("expected an error, but none was returned")
				}

				if err.Error() != test.Error {
					t.Fatalf("expected error %v, got %v", test.Error, err.Error())
				}
			}

			if val != test.Expected {
				t.Fatalf("unepxected error: want %v, got %v", test.Expected, val)
			}
		})
	}
}
